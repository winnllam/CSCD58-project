import requests
import json
from constants import (API, BILLS, VOTES, POLITICIANS, DEBATES, COMMITTEES)

class OpenParlimentApi:
    
    def __init__(self, topic, params):
        self.topic = topic
        self.params = params
    
    def get_data(self):
        url = API + "/" + self.topic
        headers = {
            'Content-type': 'application/json', 
            'Accept': 'text/plain'
        }
        response = requests.get(url, headers=headers, params=self.params)
        
        if response.status_code == 200:
            print("success")
            return response.json()
        else:    
            print("failed")
         

params = {
    'family_name': 'Trudeau'
}
api = OpenParlimentApi(POLITICIANS, params)
text = json.dumps(api.get_data(), sort_keys=True, indent=4)
print(text)