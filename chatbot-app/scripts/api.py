import requests
import json
from constants import (API, BILLS, VOTES, POLITICIANS, DEBATES, COMMITTEES, PAGINATION, PREV, NEXT, OBJECTS, URL)

class OpenParlimentApi:
    endpoint = ''
    params = {}
    prev_url = ''
    next_url = ''
    curr_data = {}
    
    def __init__(self, endpoint, params):
        self.endpoint = endpoint
        self.params = params
    
    # Main function to call the Open Parliment API, returns result (maybe parsed)
    def get_data(self, url=''):
        if url == '':
            url = API + "/" + self.endpoint
        
        headers = {
            'Content-type': 'application/json', 
            'Accept': 'text/plain'
        }
        response = requests.get(url, headers=headers, params=self.params)
        
        if response.status_code == 200:
            print("success")
            res = response.json()
            if PAGINATION in res:
                return self.parse_data(res)
            else:
                self.curr_data = res
                return res
        else:    
            print("failed")
            return None

    # Get previous pagination output
    def get_prev(self):
        if self.prev_url != None:
            url = API + self.prev_url
            return self.get_data(url)
        return None

    # Get next pagination output
    def get_next(self):
        if self.next_url != None:
            url = API + self.next_url
            return self.get_data(url)
        return None
         
    # Parse filtered data output (into dict and store other relevant into from the call)
    def parse_data(self, data):
        parsed = {}

        # update pagination status
        self.prev_url = data[PAGINATION][PREV]
        self.next_url = data[PAGINATION][NEXT]
        # get the actual content out
        objects = data[OBJECTS]
        
        # make URL the key (works for all)
        for item in objects:
            key = item[URL]
            parsed[key] = item

        self.curr_data = parsed
        return parsed

    # Get output from a direct link from content (not filtered)
    def get_sub_data(self, key):
        url = API + key
        return self.get_data(url)
        


params = {
    'family_name': 'Trudeau'
}
api = OpenParlimentApi(BILLS, {})
text = json.dumps(api.get_data(), sort_keys=True, indent=4)
print(text)
next_text = json.dumps(api.get_next(), sort_keys=True, indent=4)
print(next_text)
sub = json.dumps(api.get_sub_data('/bills/37-1/C-40/'), sort_keys=True, indent=4)
print(sub)
