from os import urandom
import base64

def generate_master_key():
    ''' 
        Generates a master key for file encryption/decryption
    
        WARNING: If you lose this key, all the files in your cloud storage will be encrypted
        and unrecoverable. If you must share the key, share it securely with something like
        PGP or Firefox Send.
     '''
    master_key = open('./MASTER_KEY.pem', 'w')
    master_key.write(base64.b64encode(urandom(32)).decode("utf-8"))
    master_key.close()

if __name__ == "__main__":
    generate_master_key()