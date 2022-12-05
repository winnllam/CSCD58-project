import requests
import json

API = "http://api.openparliament.ca"
LIMIT = "limit"
LIMIT_VAL = 5

BILLS = "bills"
VOTES = "votes"
POLITICIANS = "politicians"
DEBATES = "debates"
COMMITTEES = "committees"

LIST_OF_TOPICS = [BILLS, VOTES, POLITICIANS, DEBATES, COMMITTEES]

TOPICS = {
    BILLS: [
        ["introduced", "Date bill was introduced in the format yyyy-mm-dd"],
        ["legisinfo_id", "ID assigned by parl.gc.ca's LEGISinfo"],
        ["private_member_bill", "Is it a private member's bill? True or False"],
        ["law", "Did it become law? True or False"],
        ["number", "ex. C-10"],
        ["session", "Session number, ex. 41-1"]
    ],
    VOTES: [
        ["bill", "ex. /bills/41-1/C-10/"],
        ["nay_total", "votes against"],
        ["yea_total", "votes for"],
        ["session", "ex. 41-1"],
        ["date", "ex. 2011-01-01"],
        ["number", "every vote in a session has a sequential number"],
        ["result", "Passed, Failed, Tie"]
    ],
    POLITICIANS: [
        ["family_name", "ex. Harper"],
        ["given_name", "ex. Stephen"],
        ["include", "'former' to show former MPs (since 94), 'all' for current and former"],
        ["name", "ex. Stephen Harper"]
    ],
    DEBATES: [
        ["date", "ex. 2010-01-01"],
        ["number","Each Hansard in a session is given a sequential #"],
        ["session", "ex. 41-1"]
    ],
    COMMITTEES: [
        ["session", "??"]
    ]
}

PAGINATION = "pagination"
PREV = "previous_url"
NEXT = "next_url"

OBJECTS = "objects"
URL = "url"

class OpenParlimentApi:
    endpoint = ''
    params = {}
    prev_url = ''
    next_url = ''
    curr_data = {}
    
    def __init__(self, endpoint, params):
        self.endpoint = endpoint
        self.params = params
        self.params[LIMIT] = LIMIT_VAL
    
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
        


# params = {
#     'family_name': 'Trudeau'
# }
# api = OpenParlimentApi(BILLS, {})
# text = json.dumps(api.get_data(), sort_keys=True, indent=4)
# print(text)
# next_text = json.dumps(api.get_next(), sort_keys=True, indent=4)
# print(next_text)
# sub = json.dumps(api.get_sub_data('/bills/37-1/C-40/'), sort_keys=True, indent=4)
# print(sub)
