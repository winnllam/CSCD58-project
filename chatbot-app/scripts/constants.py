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
        'law': 'Did it become law? True or False',
        'session': 'Session number, ex. 41-1'
    },
    VOTES: {

    },
}

PAGINATION = 'pagination'
PREV = 'previous_url'
NEXT = 'next_url'

OBJECTS = 'objects'
URL = 'url'
