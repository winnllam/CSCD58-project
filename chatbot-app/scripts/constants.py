API = "http://api.openparliament.ca"
LIMIT = "limit"
LIMIT_VAL = 5

BILLS = "bills"
VOTES = "votes"
POLITICIANS = "politicians"
DEBATES = "debates"
COMMITTEES = "committees"

TOPICS = {
    BILLS: {
        "introduced": "Date bill was introduced in the format yyyy-mm-dd",
        "legisinfo_id": "ID assigned by parl.gc.ca's LEGISinfo",
        "private_member_bill": "Is it a private member's bill? True or False",
        "law": "Did it become law? True or False",
        "number": "ex. C-10",
        "session": "Session number, ex. 41-1"
    },
    VOTES: {
        "bill": "ex. /bills/41-1/C-10/",
        "nay_total": "votes against",
        "yea_total": "votes for",
        "session": "ex. 41-1",
        "date": "ex. 2011-01-01",
        "number": "every vote in a session has a sequential number",
        "result": "Passed, Failed, Tie"
    },
    POLITICIANS: {
        "family_name": "ex. Harper",
        "given_name": "ex. Stephen",
        "include": "'former' to show former MPs (since 94), 'all' for current and former",
        "name": "ex. Stephen Harper"
    },
    DEBATES: {
        "date": "ex. 2010-01-01",
        "number": "Each Hansard in a session is given a sequential #",
        "session": "ex. 41-1"
    },
    COMMITTEES: {
        "session": "??"
    }
}

PAGINATION = "pagination"
PREV = "previous_url"
NEXT = "next_url"

OBJECTS = "objects"
URL = "url"
