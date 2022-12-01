API = 'http://api.openparliament.ca'
LIMIT = 'limit'
LIMIT_VAL = 5

BILLS = 'bills'
VOTES = 'votes'
POLITICIANS = 'politicians'
DEBATES = 'debates'
COMMITTEES = 'committees'

TOPICS = {
    BILLS: {
        'introduced': 'Date bill was introduced in the format yyyy-mm-dd',
        'legisinfo_id': "ID assigned by parl.gc.ca's LEGISinfo",
        'private_member_bill': "Is it a private member's bill? True or False",
        'law': 'Did it become law? True or False',
        'number': 'ex. C-10',
        'session': 'Session number, ex. 41-1'
    },
    VOTES: {
        'bill': 'ex. /bills/41-1/C-10/',
        'nay_total': 'votes against',
    },
}

PAGINATION = 'pagination'
PREV = 'previous_url'
NEXT = 'next_url'

OBJECTS = 'objects'
URL = 'url'
