import json
import os

def sort_languages(og_filename, new_filename):
    ''' 
        Reads og_filename and outputs a sorted new_filename 

        Args:
            og_filename - File to be sorted
            new_filename - New sorted file    
    '''

    j = json.loads(open(og_filename, "r").read())
    new_j = open(new_filename, "w")

    json.dump(j, new_j, indent=4, sort_keys=True, ensure_ascii=False)

if __name__ == "__main__":
    original_file = "language.json"
    sorted_file = "language_sorted.json"

    sort_languages(original_file, sorted_file)