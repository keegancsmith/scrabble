import eventlet

from django.conf import settings
from redis import Redis

class Subscriber(object):
    def __init__(self):
        self.redis = Redis(**settings.REDIS)
        self.events = {}

    def wait(self, game_id):
        if game_id not in self.events:
            print 'Subscribing to', 'game.%d' % game_id
            self.events[game_id] = eventlet.event.Event()
            self.redis.subscribe('game.%d' % game_id)
            if len(self.events) == 1:
                eventlet.spawn(self._listen)
        print "waiting %d" % game_id, self.events[game_id]
        self.events[game_id].wait()
        print "done", self.events[game_id]

    def _listen(self):
        for msg in self.redis.listen():
            if msg['type'] == 'message':
                _, game_id = msg['channel'].split('.')
                game_id = int(game_id)
                print "publishing %d" % game_id, self.events[game_id]
                self.events[game_id].send()
                self.events[game_id].reset()

class Publisher(object):
    def __init__(self):
        self.redis = Redis(**settings.REDIS)

    def publish(self, game_id):
        self.redis.publish('game.%d' % game_id, 'new move')

_subscriber = Subscriber()
_publisher = Publisher()

wait = _subscriber.wait
publish = _publisher.publish
