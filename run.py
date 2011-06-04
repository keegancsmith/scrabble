#!/usr/bin/env python

import os
import traceback

from django.core.handlers.wsgi import WSGIHandler
from django.core.signals import got_request_exception

if 'DJANGO_SETTINGS_MODULE' not in os.environ:
    os.environ['DJANGO_SETTINGS_MODULE'] = 'example_project.settings'

def exception_printer(sender, **kwargs):
    traceback.print_exc()
got_request_exception.connect(exception_printer)

application = WSGIHandler()

if __name__ == '__main__':
    from eventlet import monkey_patch, wsgi, listen
    monkey_patch(thread=False)
    wsgi.server(listen(('', 8000)), application)
