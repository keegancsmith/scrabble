from scrabbleapp.models import Game

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseForbidden
from django.shortcuts import render_to_response, get_object_or_404


def game_required(func):
    def f(request, game_id, *args, **kw):
        game = get_object_or_404(Game, pk=game_id)
        if request.user not in game.players.all():
            raise HttpResponseForbidden()
        request.game = game
        return f(request, *args, **kw)
    return login_required(f)

@login_required
def create_game(request):
    return HttpResponse('<html><body>create_game</body></html>')

@login_required
def active_games(request):
    games = request.user.game_set.all()
    return HttpResponse('<html><body>active_games<ul>%s</ul></body></html>' %
                        '\n'.join('<li>%s</li>' % unicode(g) for g in games))

@game_required
def game_state(request):
    return HttpResponse('<html><body>game_required</body></html>')

@game_required
def game_play_tiles(request):
    return HttpResponse('<html><body>game_play_tiles</body></html>')

@game_required
def game_pass(request):
    return HttpResponse('<html><body>game_pass</body></html>')

@game_required
def game_swap_tiles(request):
    return HttpResponse('<html><body>game_swap_tiles</body></html>')
