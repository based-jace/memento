# -*- coding: utf-8 -*-

import traceback

# For generating unique, relatively secure files and folders
from secrets import token_urlsafe

# Flask stuff
from flask import Flask, jsonify, render_template
from flask_restful import request
import json

# For Decryption
from base64 import b64decode

# For Firebase, Firestore, and Google Cloud Storage
import firebase_admin
from firebase_admin import auth, credentials, firestore
from google.oauth2 import id_token
from google.cloud import storage
from google.cloud.storage import Blob

# For Downloading Files
import os, platform, pytz, shutil
from datetime import datetime, timezone

# For changing file names if files already exist in the cloud
import re

storage_client = None   # Client for interacting with Google Cloud Storage
bucket = None           # Google Cloud Storage bucket
encryption_key = None   # Encrypts and decrypts files

with open('./config.json') as config_file:
    config = json.load(config_file)

try:
    with open('./MASTER_KEY.pem') as key_file:
        # Encoded encryption key
        master_key = key_file.read()
except Exception as e:
    print(traceback.format_exc())
    print("No master key. Please run generate_master_key.py")
    exit()

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = './firebase_creds.json'
os.environ['FLASK_ENV'] = config["FLASK_ENV"]

cred = credentials.Certificate('./firebase_creds.json')
default_app = firebase_admin.initialize_app(cred)

db = firestore.client()

def verify_auth_token(token):
    ''' Decodes and returns the given Firebase JWT '''
    return auth.verify_id_token(token)

def prepare_client():
    ''' Sets the storage client, grabs the firebase bucket given in the config, and decodes the master key '''
    global storage_client, bucket, encryption_key
    storage_client = storage.Client()
    bucket = storage_client.get_bucket("{}".format(config["DOCUMENTS"]["BUCKET"]))
    encryption_key = b64decode(master_key)


def get_cloud_folder(uid):
    ''' 
        Grabs user's cloud path using config variables and the given user's id
        
        Args:
            uid - firestore user's document id

        Returns:
            str: path to user's file folder in the cloud
     '''
    folder = "{}/{}{}/".format(config["DEPLOYMENT_LEVEL"], config["DOCUMENTS"]["GCS_PATH"], uid)
    return folder


def list_documents(uid):
    ''' 
        Gets list of specified user's files

        Args:
            uid - firestore user's document id

        Returns:
            [{name:str, timestamp: str}]: a list of dicts representing the given user's files
    '''
    blobs = bucket.list_blobs(prefix=get_cloud_folder(uid))
    return [
        {"name": blob.name.split("/").pop(), "timestamp": blob.updated} for blob in blobs
    ]


def download_documents(user_id, docs):
    '''
        Downloads given user's files to server; Creates download link and returns it to user.

        If more than one file is specified, zip the files and return the zip folder.
        Otherwise return the single file.

        Args:
            user_id: firestore user's document id
            docs: a list of filenames

        Returns:
            str: Path to new file
    '''
    if len(docs) < 1:
        return {"error": "No files selected"}

    higher_path = os.path.dirname(os.path.abspath(__file__))
    static_path = "/static/" + config["DOCUMENTS"]["USER_DOWNLOADS_PATH"]
    path_str = "{}_{}_{}".format(
        user_id,
        datetime.now(tz=pytz.timezone("Europe/Berlin")).strftime("%H.%M.%S_%d-%m-%Y"),
        token_urlsafe(8) # 8 Random Bytes
    )
    full_path = higher_path + static_path + path_str
    os.makedirs(full_path) # Ensures the path to the file has been created

    for doc in docs: # Downloads each file
        blob = Blob(get_cloud_folder(user_id) + doc, bucket, encryption_key=encryption_key)
        blob.download_to_filename(full_path + "/" + doc)

    if len(docs) > 1: # If more than one file, zips them
        shutil.make_archive(full_path, "zip", full_path)
        zipped_docs = static_path + path_str + ".zip"
        return {"download_path": zipped_docs} # Returns zip file

    

    return {'download_path': static_path + path_str + "/" + docs[0]} # Returns single file


def upload_document(document, uid):
    '''
        Uploads given document to given user's folder

        If a file like "documentname.ext" already exists,
        find next best name as so: "documentname_({i})" where {i} is a number between
        1 and the number of similarly-named files + 1

        Args:
            document - File blob given by user
            uid - firestore user's document id

    '''
    try:
        new_file = None
        flags = re.U | re.I
        file_no_ext = re.sub(r"\.[a-z]+$", "" , document.filename, flags=flags)
        file_ext = re.search(r"\.[a-z]+$", document.filename, flags).group(0)
        
        # Lists current files in the database
        blobs = storage_client.list_blobs(bucket, prefix=get_cloud_folder(uid) + file_no_ext)

        # Grabs all files with the same basic file name
        files = [re.search(r"[^\\\/:*?\"<>]+\.[a-z]+$", blob.name, flags).group(0) for blob in blobs]
        next_file_name = None

        # If no similarly-named files or the first one is not an exact match
        if len(files) == 0 or files[0] != document.filename:
            # New file keeps its original name
            new_file = Blob(get_cloud_folder(uid) + document.filename, bucket, encryption_key=encryption_key)

        if new_file == None:
            for i, blob in enumerate(files):
                # Tries to find an open similar file name between 1 and the number of files
                next_file_name = str.format("{}_({}){}", file_no_ext, i+1, file_ext)
                if next_file_name not in files:
                    print(next_file_name, blob)
                    new_file = Blob(get_cloud_folder(uid) + next_file_name, bucket, encryption_key=encryption_key)
                    break

        # If no open filename
        if new_file == None:
            # New file name is the number of files + 1
            next_file_name = str.format("{}_({}){}", file_no_ext, i+1, file_ext)
            new_file = Blob(get_cloud_folder(uid) + next_file_name, bucket, encryption_key=encryption_key)

        # Creates file from the given blob and uploads it to Google Cloud Storage
        new_file.upload_from_string(document.read(), content_type=document.content_type)

    except Exception as e:
        print(e)


def delete_documents(documents, uid):
    ''' 
        Deletes the given user's specified documents 

        Args:
            documents - list of document_names
            uid - firestore user's document id
    '''
    for document in documents:
        blob = Blob(get_cloud_folder(uid) + document, bucket, encryption_key=encryption_key)
        blob.delete()


def create_app():
    ''' Creates and returns Flask app instance '''
    app = Flask(__name__)
    app.config.update({
        "SECRET_KEY": config["SECRET_KEY"]
    })

    @app.route('/', methods=['GET'])
    def index():
        ''' Index/Login page '''
        if request.method == "GET":
            return render_template('web/index.html')

    @app.route("/admin/", methods=["GET"])
    def admin_page():
        ''' Admin page '''
        return render_template('web/adminpage.html')

    @app.route('/user/', defaults={"id": None})
    @app.route('/user/<id>/', methods=['GET', 'POST', 'PUT', 'DELETE'])
    def user_main(id):
        ''' Page of user whose firestore document id is <id> '''
        if request.method == "GET":
            return render_template('web/usermain.html', id=id)
        try:
            auth_token = request.headers['Authorization'].split(' ').pop()
            decoded_auth_token = verify_auth_token(auth_token)
            uid = decoded_auth_token["uid"]
        except:
            return jsonify(message="authNotVerified", messageType="error")
        try:
            # Ensure user has attributes
            user_data = db.collection(config["DOCUMENTS"]["USER_COLLECTION"]).document(uid).get()
            user_atts = user_data.to_dict()
            if user_atts == None:
                raise FileNotFoundError("User attributes not found. Please contact an administrator.")
            is_admin = user_atts["is_admin"]
        except:
            return jsonify(message="userAttributesNotFound", messageType="error")
        try:
            # Gets user's document id
            data = request.form.to_dict()
            this_uid = data["user"]
        except:
            return jsonify(message="noUserRequested", messageType="info")
        if not is_admin and uid != this_uid:
            return jsonify(message="notAuthorizedToMakeRequest", messageType="error")

        if request.method == "POST":
            # Download Document(s)
            try:
                docs = json.loads(data["docs"])
                download_link = download_documents(this_uid, docs)
            except:
                return jsonify(message="dataNotSentCorrectly", messageType="error")

            return jsonify(download_link)

        if request.method == "PUT":
            # Upload Document(s)
            try:
                for doc in request.files.to_dict().values():
                    upload_document(doc, this_uid)
            except:
                return jsonify(message="dataNotSentCorrectly", messageType="error")
            return jsonify(message="filesSuccessfullyUploaded", messageType="success")
        
        if request.method == "DELETE":
            # Delete Document(s)
            try:
                docs = json.loads(data["docs"])
            except:
                return jsonify(message="noDocs", messageType="info")

            delete_documents(docs, this_uid)
            return jsonify(message="filesSuccessfullyDeleted", messageType="success")

        return jsonify(message="badRequest", messageType="error")

    @app.route('/user/documents/', methods=['POST'])
    def documents():
        ''' Gets list of documents for the current user '''
        try:
            auth_token = request.headers['Authorization'].split(' ').pop()
            verify_auth_token(auth_token)
        except:
            return jsonify(message="authNotVerified", messageType="error")

        if request.method == "POST":
            # List Document(s)
            try:
                this_uid = request.form.to_dict()["user"]
            except:
                return jsonify(message="userNotRequested", messageType="info")
            return jsonify(list_documents(this_uid))

        return jsonify(message="badRequest", messageType="error")

    return app
    
prepare_client()
app = create_app()

if __name__ == '__main__':
    debug = True
    app.run(debug=debug, host="0.0.0.0")
