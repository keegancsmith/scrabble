import eventlet

from django.conf import settings
from eventlet import tpool
from functools import partial
from redis import Redis


class Subscriber(object):
    def __init__(self):
        self.redis = Redis(**settings.REDIS)
        self.events = {}

    def wait(self, game_id):
        if game_id not in self.events:
            self.events[game_id] = eventlet.event.Event()
            self.redis.subscribe('scrabble.%d' % game_id)
            if len(self.events) == 1:
                eventlet.spawn_n(_subscriber._listen)
        # XXX we need to clean up events, otherwise the size of this dict will
        # be unbounded.
        return self.events[game_id].wait()

    def _listen(self):
        for msg in self.redis.listen():
            if msg['type'] == 'message':
                _, game_id = msg['channel'].split('.')
                game_id = int(game_id)
                msg_type, player_num, msg = msg['data'].split(':', 2)
                self.events[game_id].send()
                self.events[game_id].reset()

class Publisher(object):
    def __init__(self):
        self.redis = Redis(**settings.REDIS)

    def _publish(self, game_id, msg):
        self.redis.lpush('scrabble.%d.history' % game_id, msg)
        self.redis.publish('scrabble.%d' % game_id, msg)

    def publish_move(self, game_id, player, msg):
        self._publish(game_id, 'm:%s:%s' % (player, msg))

    def publish_chat(self, game_id, player, msg):
        self._publish(game_id, 'c:%s:%s' % (player, msg))

    def cursor(self, game_id):
        return self.redis.llen('scrabble.%d.history' % game_id)

    def history(self, game_id, cursor=0):
        return self.redis.lrange('scrabble.%d.history' % game_id, 0, -cursor - 1)

_subscriber = Subscriber()
_publisher = Publisher()

wait = _subscriber.wait
publish_move = partial(tpool.execute, _publisher.publish_move)
publish_chat = partial(tpool.execute, _publisher.publish_chat)
cursor = partial(tpool.execute, _publisher.cursor)
history = partial(tpool.execute, _publisher.history)
