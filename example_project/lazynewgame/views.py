from forms import LazyUserCreationForm
from models import GameLobby

from annoying.decorators import render_to
from django.contrib.auth import SESSION_KEY, authenticate, login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST


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
        if request.method == 'POST':
            lazy_form = LazyUserCreationForm(request.POST)
            if lazy_form.is_valid():
                username = lazy_form.save()
                # Setup user session. From lazysignup.decorators
                request.user = None
                user = authenticate(username=username)
                request.session[SESSION_KEY] = user.id
                login(request, user)
                return HttpResponseRedirect(reverse('lobby-join', args=[uuid]))
        else:
            lazy_form = LazyUserCreationForm()
        return {
            'lobby': gl,
            'login_form': AuthenticationForm(),
            'lazy_form': lazy_form,
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

    if gl.user_can_join(request.user):
        gl.add_player(request.user)
    return HttpResponseRedirect(gl.get_absolute_url())
