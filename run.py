#!/usr/bin/env python

import sys
import os
import traceback

from django.core.handlers.wsgi import WSGIHandler
from django.core.management import call_command
from django.core.signals import got_request_exception

if 'DJANGO_SETTINGS_MODULE' not in os.environ:
    os.environ['DJANGO_SETTINGS_MODULE'] = 'example_project.settings'

def exception_printer(sender, **kwargs):
    traceback.print_exc()

got_request_exception.connect(exception_printer)

application = WSGIHandler()

if __name__ == '__main__':
    from eventlet import wsgi
        
    print 'Serving on 8080...'
    eventlet.wsgi.server(eventlet.listen(('', 8080)), application)
