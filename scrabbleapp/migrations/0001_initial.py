# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):

        # Adding model 'Game'
        db.create_table('scrabbleapp_game', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('winner', self.gf('django.db.models.fields.related.ForeignKey')(default=None, related_name='winner', null=True, blank=True, to=orm['auth.User'])),
            ('current_player', self.gf('django.db.models.fields.related.ForeignKey')(related_name='playing', to=orm['auth.User'])),
            ('active', self.gf('django.db.models.fields.BooleanField')(default=True)),
            ('date_created', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime.now)),
            ('last_played', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime.now)),
            ('turn', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('game_instance', self.gf('picklefield.fields.PickledObjectField')()),
        ))
        db.send_create_signal('scrabbleapp', ['Game'])

        # Adding model 'GamePlayer'
        db.create_table('scrabbleapp_gameplayer', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('game', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['scrabbleapp.Game'])),
            ('player_num', self.gf('django.db.models.fields.IntegerField')()),
        ))
        db.send_create_signal('scrabbleapp', ['GamePlayer'])


    def backwards(self, orm):

        # Deleting model 'Game'
        db.delete_table('scrabbleapp_game')

        # Deleting model 'GamePlayer'
        db.delete_table('scrabbleapp_gameplayer')


    models = {
        'auth.group': {
            'Meta': {'object_name': 'Group'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'auth.permission': {
            'Meta': {'ordering': "('content_type__app_label', 'content_type__model', 'codename')", 'unique_together': "(('content_type', 'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        'scrabbleapp.game': {
            'Meta': {'object_name': 'Game'},
            'active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'current_player': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'playing'", 'to': "orm['auth.User']"}),
            'date_created': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'game_instance': ('picklefield.fields.PickledObjectField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'last_played': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'players': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.User']", 'through': "orm['scrabbleapp.GamePlayer']", 'symmetrical': 'False'}),
            'turn': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'winner': ('django.db.models.fields.related.ForeignKey', [], {'default': 'None', 'related_name': "'winner'", 'null': 'True', 'blank': 'True', 'to': "orm['auth.User']"})
        },
        'scrabbleapp.gameplayer': {
            'Meta': {'object_name': 'GamePlayer'},
            'game': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['scrabbleapp.Game']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'player_num': ('django.db.models.fields.IntegerField', [], {}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        }
    }

    complete_apps = ['scrabbleapp']
