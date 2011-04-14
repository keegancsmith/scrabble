from scrabbleapp.models import Game

from django import forms
from django.contrib.auth.models import User


class CreateGameForm(forms.Form):
    name = forms.CharField(max_length=50)
    player1 = forms.ModelChoiceField(queryset=User.objects.none(), required=True)
    player2 = forms.ModelChoiceField(queryset=User.objects.none(), required=True)
    player3 = forms.ModelChoiceField(queryset=User.objects.none(), required=False)
    player4 = forms.ModelChoiceField(queryset=User.objects.none(), required=False)

    def __init__(self, user, *args, **kw):
        super(CreateGameForm, self).__init__(*args, **kw)
        # XXX we need a friends model
        friends_qs = User.objects.all()
        for i in range(4):
            self.fields['player%d' % (i + 1)].queryset = friends_qs

    def create_game(self):
        players = [self.cleaned_data['player%d' % i] for i in range(1, 5)]
        return Game.create_game(players, name)
