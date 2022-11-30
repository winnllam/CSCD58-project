
import json
from api import OpenParlimentApi;
from constants import (API, LIMIT, LIMIT_VAL, BILLS, VOTES, POLITICIANS, DEBATES, COMMITTEES, TOPICS, PAGINATION, PREV, NEXT, OBJECTS, URL)

# give the user a list of stuff we offer for them to know about
# only the main api topics are available bc idc
list_of_topics = [BILLS, VOTES, POLITICIANS, DEBATES, COMMITTEES]
print("Here are the available topics to search about: ")
topic_input = 0

# use the index from the list to determine which api to hit
topic = list_of_topics[topic_input]

# depending on what they want to ask about, we give the sub options that are specific to each topic
# use the dictionares to list out the options and description 
print("Here are the available filters for the topic xxx")
sub_topics = TOPICS[topic]
for st in sub_topics:
    print(st + ": " + sub_topics[st])

# they can choose to add multiple filters on
filters = {}
print("Would you like to add a filter?")

# should have a no option after the list of filters
print("no")

# if no then just hit the end point with the topic
api = OpenParlimentApi(topic, filters)
# text = json.dumps(api.get_data(), sort_keys=True, indent=4)

# print out the text nicer probably?
# each one separate so they can tell which one they want to go to if they want more details
# print(text)

# put each one separate in a list so we can use indexing to know which one they want
text_list = api.get_data().values()
print(text_list)
print("here is the output we found: ")
for i in range(len(text_list)):
    print(str(i + 1) + ". " + text_list[i])

# ask if they want to see one of the specific outputs
# we output the key/url for them to select

# need an option for prev and next (if applicable)

# then we hit that end point