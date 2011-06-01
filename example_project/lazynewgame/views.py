from models import GameLobby

from annoying.decorators import render_to
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST
from lazysignup.decorators import allow_lazy_user


@login_required
def new_lobby(request):
    gl = GameLobby.objects.create()
    gl.add_player(request.user)
    return HttpResponseRedirect(gl.get_absolute_url())

@render_to('lazynewgame/lobby.html')
def lobby(request, uuid):
    gl = get_object_or_404(GameLobby, uuid=uuid)

    in_game = request.user in gl.players.all()

    if not in_game:
        if gl.game_started:
            return { 'error': 'it has already started' }
        elif gl.is_full():
            return { 'error': 'it is full' }
    elif gl.game_started:
        return HttpResponseRedirect(gl.game.get_absolute_url())

    if request.user.is_anonymous():
        return {
            'lobby': gl,
            'login_form': AuthenticationForm(),
        }

    return { 'lobby': gl, 'in_game': in_game }

@require_POST
@login_required
def create_game(request, uuid):
    gl = get_object_or_404(GameLobby, uuid=uuid)

    if gl.game is not None:
        return HttpResponseRedirect(gl.game.get_absolute_url())

    if gl.creator != request.user or gl.players.count() < 2:
        return HttpResponseRedirect(gl.get_absolute_url())

    g = gl.create_game()
    return HttpResponseRedirect(g.get_absolute_url())

def join(request, uuid):
    gl = get_object_or_404(GameLobby, uuid=uuid)

    # We only want to create the user if the url exists, but if we use
    # allow_lazy_user as a decorator it will create the user even if the url
    # doesnt exist. So this is a hack to get at the function inside of the
    # decorator
    @allow_lazy_user
    def do_join(request):
        if gl.user_can_join(request.user):
            gl.add_player(request.user)
        return HttpResponseRedirect(gl.get_absolute_url())

    return do_join(request)
