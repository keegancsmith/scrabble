import multiprocessing
import os.path

__dir__ = os.path.dirname(os.path.abspath(__file__))
run_dir = os.path.join(os.path.dirname(__dir__), 'run')

if not os.path.exists(run_dir):
    import os
    os.mkdir(run_dir)

bind = 'unix:' + os.path.join(run_dir, 'gunicorn.sock')
logfile = os.path.join(run_dir, 'gunicorn.log')
pidfile = os.path.join(run_dir, 'gunicorn.pid')
daemon = True

worker_class = 'gunicornsupport.EventletWorker'
workers = multiprocessing.cpu_count() * 2 + 1
