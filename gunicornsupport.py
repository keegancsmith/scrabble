from gunicorn.workers import geventlet

class EventletWorker(geventlet.EventletWorker):
    @classmethod
    def setup(cls):
        import eventlet
        if eventlet.version_info < (0,9,7):
            raise RuntimeError("You need eventlet >= 0.9.7")
        eventlet.monkey_patch(os=False, thread=False)
