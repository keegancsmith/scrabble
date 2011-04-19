from django.contrib.auth.models import User
from scrabbleapp.models import Game

u = list(User.objects.all()[:4])
Game.create_game(u, 'test game')
