.. -*- mode: rst -*-

==========
 Scrabble
==========

This is a scrabble clone which uses HTML5's Canvas for the UI and Django and
Eventlet for the server. The goal is to make a scrabble clone which works on
iOS, Android and desktop machines.

There currently isn't a publicly accessible server, but you can run your own
server. First make sure you have virtualenv and pip (on Ubuntu install
python-virtualenv and python-pip). Then you can run the following commands to
get a running server::

  $ hg clone https://keegan_csmith@bitbucket.org/keegan_csmith/scrabble
  $ cd scrabble
  $ virtualenv --no-site-packages env
  $ source env/bin/activate
  $ pip install -r requirements.txt
  $ pip install -r example_project/requirements.txt
  $ (cd data; ./fetch_dictionaries.sh)
  $ python example_project/manage.py syncdb
  $ python example_project/manage.py runserver 0:8000

You should now have a server running at http://localhost:8000/
