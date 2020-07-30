from jarvis.model import *
from collections import defaultdict
import pickle
import re


def preprocess_index():
    index = {}
    with open('data/courses.pickle', 'rb') as courses_file:
        courses = pickle.load(courses_file)

    for course in courses:
        data_str = '%s %s %s' % (course.crn, course.title, course.course)
        for meeting in course.meetings:
            instructor_name = '%s %s' % (meeting.instructor.first_name,
                                         meeting.instructor.last_name)
            if instructor_name not in data_str:
                data_str += " " + instructor_name
        index[data_str] = course
    with open('data/index.pickle', 'wb') as index_file:
        pickle.dump(index, index_file)

def search(search, class_types):
    search = search.lower()

    index_map = {"hybrid": '*',
                 "communities": '+',
                 "community-service": '^',
                 "offcampus": '#'}

    index_set = {index_map[class_type] for class_type in set(class_types)}

    with open('data/index.pickle', 'rb') as index_file:
        index = pickle.load(index_file)

    split = search.split()
    matches_list = []
    for x in range(len(split)):
        matches_raw = [v for (k, v) in index.items() if split[x] in k.lower()]
        if not x == 0:
            matches_list = [i for i in matches_list if i in matches_raw]
        else:
            matches_list = matches_raw
    matches = defaultdict(list)
    regex = re.compile(r"-0*")
    for match in matches_list:
        if match.course[0] in index_set:
            if match.course[10] == '.':
                match_key = match.course[2:10]
                match_key = regex.sub(" ", match_key)
                matches[match_key].append(match)
            else:
                match_key = match.course[2:11]
                match_key = regex.sub(" ", match_key)
                matches[match_key].append(match)
        elif match.course[0] not in set(index_map.values()) ^ index_set:
            if match.course[8] == '.':
                match_key = match.course[:8]
                match_key = regex.sub(" ", match_key)
                matches[match_key].append(match)
            else:
                match_key = match.course[:9]
                match_key = regex.sub(" ", match_key)
                matches[match_key].append(match)
    return matches
    
    
    
    #GOOGLE CALENDAR API
    import httplib2
import os

from apiclient import discovery
import oauth2client
from oauth2client import client
from oauth2client import tools

import datetime

try:
    import argparse
    flags = argparse.ArgumentParser(parents=[tools.argparser]).parse_args()
except ImportError:
    flags = None

SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'
CLIENT_SECRET_FILE = 'client_secret.json'
APPLICATION_NAME = 'Google Calendar API Quickstart'


def get_credentials():
    
    home_dir = os.path.expanduser('~')
    credential_dir = os.path.join(home_dir, '.credentials')
    if not os.path.exists(credential_dir):
        os.makedirs(credential_dir)
    credential_path = os.path.join(credential_dir,
                                   'calendar-quickstart.json')

    store = oauth2client.file.Storage(credential_path)
    credentials = store.get()
    if not credentials or credentials.invalid:
        flow = client.flow_from_clientsecrets(CLIENT_SECRET_FILE, SCOPES)
        flow.user_agent = APPLICATION_NAME
        if flags:
            credentials = tools.run_flow(flow, store, flags)
        else: # Needed only for compatability with Python 2.6
            credentials = tools.run(flow, store)
        print 'Storing credentials to ' + credential_path
    return credentials

def main():
    
    credentials = get_credentials()
    http = credentials.authorize(httplib2.Http())
    service = discovery.build('calendar', 'v3', http=http)

    now = datetime.datetime.utcnow().isoformat() + 'Z' # 'Z' indicates UTC time
    print 'Getting the upcoming 10 events'
    eventsResult = service.events().list(
        calendarId='primary', timeMin=now, maxResults=10, singleEvents=True,
        orderBy='startTime').execute()
    events = eventsResult.get('items', [])

    if not events:
        print 'No upcoming events found.'
    for event in events:
        start = event['start'].get('dateTime', event['start'].get('date'))
        print start, event['summary']


if __name__ == '__main__':
    main()

