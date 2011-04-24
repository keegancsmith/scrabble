var canvas;
var ctx;
var game_id;

// Game Logic State -- Fetched from Server
var immutable_state = null;
var state = null;

// UI State
var board_image;
var ui_state = {
    'redraw': true,
    'selected_tile': null,
    'selected_tile_pos': null,
    'selected_tile_prev_pos': null,
    'rack_tiles_on_board': {},
    'rack_tiles_on_board_idx': {}
};
var ui_immutable_state = {
    'cell_size': 500 / 15,
    'board_offset': [50, 10],
    'rack_offset': [50 + (500 / 15) * 4, 530]
};

// Only used in draw_board
var multipliers = {
    'word': {"0,7": 3, "14,0": 3, "0,0": 3, "1,1": 2, "13,1": 2, "1,13": 2, "4,10": 2, "3,3": 2, "12,2": 2, "2,2": 2, "4,4": 2, "7,0": 3, "11,3": 2, "2,12": 2, "7,7": 2, "10,4": 2, "13,13": 2, "7,14": 3, "10,10": 2, "14,14": 3, "12,12": 2, "14,7": 3, "11,11": 2, "3,11": 2, "0,14": 3},
    'letter': {"7,3": 2, "0,3": 2, "1,9": 3, "1,5": 3, "6,8": 2, "2,8": 2, "13,9": 3, "2,6": 2, "12,6": 2, "3,7": 2, "5,9": 3, "9,9": 3, "9,1": 3, "11,0": 2, "5,1": 3, "3,0": 2, "11,7": 2, "5,5": 3, "8,8": 2, "8,6": 2, "3,14": 2, "6,6": 2, "8,2": 2, "8,12": 2, "7,11": 2, "5,13": 3, "9,5": 3, "14,11": 2, "9,13": 3, "6,2": 2, "12,8": 2, "14,3": 2, "6,12": 2, "0,11": 2, "11,14": 2, "13,5": 3}
};
var tile_value = {"A": 1, "C": 3, "B": 3, "E": 1, "D": 2, "G": 2, "F": 4, "I": 1, "H": 4, "K": 5, "J": 8, "M": 3, "L": 1, "O": 1, "N": 1, "Q": 10, "P": 3, "S": 1, "R": 1, "U": 1, "T": 1, "W": 4, "V": 4, "Y": 4, "X": 8, "Z": 10, "_": 0};


function make_key(x, y) {
    return x + ',' + y;
}


function draw_line(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}


function draw_board() {
    var cell_size = ui_immutable_state.cell_size;
    var colours = { 'word'   : { 3 : '#ff4500', 2 : '#ff7f50' },
                    'letter' : { 3 : '#1e90ff', 2 : '#b0e0e6' } };
    var i;

    for (i = 0; i < 15; i++) {
        for (var j = 0; j < 15; j++) {
            var k = make_key(i, j);

            if (state !== null && k in state.board) {
                draw_tile(state.board[k], i * cell_size, j * cell_size,
                         true);
                continue;
            }

            var colour = '#cd853f';
            if (k in multipliers.word) {
                colour = colours.word[multipliers.word[k]];
            } else if (k in multipliers.letter) {
                colour = colours.letter[multipliers.letter[k]];
            }

            ctx.fillStyle = colour;
            ctx.fillRect(i * cell_size, j * cell_size, cell_size, cell_size);
        }
    }

    ctx.strokeStyle = '#deb887';
    ctx.lineWidth = 2;
    for (i = 0; i <= 15; i++) {
        var offset = i * cell_size;
        draw_line(offset, 0, offset, 15 * cell_size);
        draw_line(0, offset, 15 * cell_size, offset);
    }
}


function draw_tile(c, x, y, moveable) {
    if (moveable === undefined)
        moveable = false;

    var cell_size = ui_immutable_state.cell_size;
    var tile_colour = moveable ? '#8b4513' : '#966f33';
    var text_colour = moveable ? 'white' : 'white';

    ctx.fillStyle = tile_colour;
    ctx.fillRect(x, y, cell_size, cell_size);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = text_colour;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(c.toUpperCase(), x + cell_size / 2, y + cell_size / 2);

    if (c in tile_value) {
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(tile_value[c] + '', x + cell_size * 0.9, y + cell_size);
    }
}


function draw_rack() {
    var cell_size = ui_immutable_state.cell_size;
    var i;

    if (state === null) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Loading game...', cell_size * 7 / 2, cell_size / 2);
        return;
    }

    for (i = 0; i < state.rack.length; i++) {
        // Ignore tiles being moved or that are placed on the board
        if (i == ui_state.selected_tile ||
            i in ui_state.rack_tiles_on_board_idx)
            continue;

        if (state.rack[i].toLowerCase() == state.rack[i])
            state.rack[i] = '_';

        draw_tile(state.rack[i], i * cell_size, 0);
    }

    ctx.strokeStyle = '#f5deb3';
    ctx.lineWidth = 2;
    draw_line(0, 0, 7 * cell_size, 0);
    draw_line(0, cell_size, 7 * cell_size, cell_size);
    for (i = 0; i <= 7; i++)
        draw_line(i * cell_size, 0, i * cell_size, cell_size);
}


function draw_other_tiles() {
    var cell_size = ui_immutable_state.cell_size;

    // Draw moveable tiles on the board
    for (var k in ui_state.rack_tiles_on_board) {
        var idx = ui_state.rack_tiles_on_board[k];
        k = k.split(',');
        var x = ui_immutable_state.board_offset[0] + parseInt(k[0]) * cell_size;
        var y = ui_immutable_state.board_offset[1] + parseInt(k[1]) * cell_size;
        draw_tile(state.rack[idx], x, y);
    }
}


function draw() {
    if (!ui_state.redraw)
        return;

    ui_state.redraw = false;

    if (ui_state.selected_tile_prev_pos !== null) {
        ctx.save();
        var c = ui_immutable_state.cell_size;
        var x = ui_state.selected_tile_prev_pos.x - c / 2;
        var y = ui_state.selected_tile_prev_pos.y - c / 2;
        ctx.rect(x - 1, y - 1, x + cell_size + 1, y + cell_size + 1);
        ctx.clip();
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (board_image === undefined) {
        ctx.save();
        ctx.translate(ui_immutable_state.board_offset[0],
                      ui_immutable_state.board_offset[1]);
        draw_board();
        ctx.restore();
        board_image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else {
        ctx.putImageData(board_image, 0, 0);
    }

    ctx.save();
    ctx.translate(ui_immutable_state.rack_offset[0],
                  ui_immutable_state.rack_offset[1]);
    draw_rack();
    ctx.restore();

    draw_other_tiles();

    if (ui_state.selected_tile_prev_pos !== null) {
        ui_state.selected_tile_prev_pos = ui_state.selected_tile_pos;
        ctx.restore();
    }

    // Draw tile that is currently moving
    if (ui_state.selected_tile !== null)
        draw_tile(state.rack[ui_state.selected_tile],
                  ui_state.selected_tile_pos.x - ui_immutable_state.cell_size / 2,
                  ui_state.selected_tile_pos.y - ui_immutable_state.cell_size / 2);
}


function swap_tiles_on_rack(i, j) {
    if (i == j)
        return;

    // Assumes i is not placed on the board
    if (j in ui_state.rack_tiles_on_board_idx) {
        var k = ui_state.rack_tiles_on_board_idx[j];
        delete ui_state.rack_tiles_on_board_idx[j];

        ui_state.rack_tiles_on_board[k] = i;
        ui_state.rack_tiles_on_board_idx[i] = k;
    }

    var tmp = state.rack[i];
    state.rack[i] = state.rack[j];
    state.rack[j] = tmp;

    ui_state.redraw = true;
}


function getCursorPosition(e) {
    var x;
    var y;

    if (e.touches != undefined && e.touches.length == 1)
        e = e.touches[0];

    if (e.pageX != undefined && e.pageY != undefined) {
        x = e.pageX;
        y = e.pageY;
    } else {
        x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    x -= canvas.offsetLeft;
    y -= canvas.offsetTop;

    return {
        'x' : x,
        'y' : y
    };
}


function position_in_board(p) {
    var x = p.x - ui_immutable_state.board_offset[0];
    var y = p.y - ui_immutable_state.board_offset[1];
    if (x < 0 || y < 0)
        return null;
    x = Math.floor(x / ui_immutable_state.cell_size);
    y = Math.floor(y / ui_immutable_state.cell_size);
    if (x > 14 || y > 14)
        return null;
    return {
        'x': x,
        'y': y
    };
}


function position_in_rack(p) {
    var x = p.x - ui_immutable_state.rack_offset[0];
    var y = p.y - ui_immutable_state.rack_offset[1];
    if (x < 0 || y < 0)
        return null;
    x = Math.floor(x / ui_immutable_state.cell_size);
    y = Math.floor(y / ui_immutable_state.cell_size);
    if (x >= state.rack.length || y > 1)
        return null;
    return x;
}


function mouse_down(e) {
    if (ui_state.selected_tile !== null || state.winners.length > 0)
        return;

    var p = getCursorPosition(e);
    var i = position_in_rack(p);

    if (i === null) {
        var a = position_in_board(p);
        if (a === null)
            return;
        var k = make_key(a.x, a.y);
        if (!(k in ui_state.rack_tiles_on_board))
            return;
        i = ui_state.rack_tiles_on_board[k];
        delete ui_state.rack_tiles_on_board[k];
        delete ui_state.rack_tiles_on_board_idx[i];
    }

    ui_state.selected_tile = i;
    ui_state.selected_tile_pos = p;
    ui_state.redraw = true;

    e.preventDefault();
}

function mouse_up(e) {
    if (ui_state.selected_tile === null)
        return;

    var i = ui_state.selected_tile;
    var p = getCursorPosition(e);
    var v = position_in_board(p);

    // On a touch device when the fingers have been lifted there is no
    // position data associated with that. So use ui_state.selected_tile_pos
    // which would be the last position we drew a tile.
    if (p.x < 0) {
        p = ui_state.selected_tile_pos;
        v = position_in_board(p);
    }

    ui_state.selected_tile = null;
    ui_state.redraw = true;

    if (v === null) {
        var j = position_in_rack(p);
        if (j !== null)
            swap_tiles_on_rack(i, j);
        return;
    }

    var k = make_key(v.x, v.y);
    if (k in ui_state.rack_tiles_on_board || k in state.board)
        return;

    if (state.rack[i].toLowerCase() == state.rack[i]) {
        var choice = window.prompt('Which letter do you want to place?');
        if (choice === null) {
            return;
        } else if (! /^[a-zA-Z]$/.test(choice)) {
            alert('Must input a single letter!');
            return;
        } else {
            state.rack[i] = choice[0].toLowerCase();
        }
    }

    ui_state.rack_tiles_on_board[k] = i;
    ui_state.rack_tiles_on_board_idx[i] = k;
    ui_state.redraw = true;
}


function mouse_move(e) {
    if (ui_state.selected_tile === null)
        return;

    e.preventDefault();

    ui_state.selected_tile_pos = getCursorPosition(e);
    ui_state.redraw = true;
}


function pass() {
    $.post('/game/' + game_id + '/play/',
           { 'move': 'skip' },
           function (resp) {
               get_state();
           });
}


function swap() {
    var tiles = window.prompt('Which letters do you want to swap?\n' +
                               'Choices: ' + state.rack.join(', '));
    if (tiles === null)
        return;
    tiles = tiles.toUpperCase().replace(/\s+/g, '').split('');
    tiles.sort();

    $.post('/game/' + game_id + '/play/',
           { 'move': 'swap',
             'tiles': JSON.stringify(tiles) },
           function (resp) {
               if ('illegal_move' in resp) {
                   alert('Illegal Move: ' + resp.illegal_move);
               }
               get_state();
           });
}


function play() {
    var played_tiles = {};
    for (k in ui_state.rack_tiles_on_board) {
        played_tiles[k] = state.rack[ui_state.rack_tiles_on_board[k]];
    }
    $.post('/game/' + game_id + '/play/',
           { 'move': 'play_tiles',
             'played_tiles': JSON.stringify(played_tiles) },
           function (resp) {
               if ('illegal_move' in resp) {
                   alert('Illegal Move: ' + resp.illegal_move);
               } else {
                   get_state();
                   alert('You scored ' + resp.score + ' points');
               }
           });
}


function word_in_dictionary() {
    var word = $('#dictionary-word').val();
    $.post('/game/' + game_id + '/dictionary/',
           { word: word },
           function (resp) {
               if (resp.in_dictionary)
                   $('#dictionary-status').html(resp.word + ' is a word');
               else
                   $('#dictionary-status').html(resp.word + ' is not a word');
           });
    return false;
}


function isEmpty(map) {
    for(var key in map)
        if (map.hasOwnProperty(key))
            return false;
    return true;
}


function recall_tiles() {
    ui_state.rack_tiles_on_board = {};
    ui_state.rack_tiles_on_board_idx = {};
    ui_state.redraw = true;
}


function shuffle_tiles() {
    if (!isEmpty(ui_state.rack_tiles_on_board))
        return;
    for (var i = state.rack.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = state.rack[i];
        state.rack[i] = state.rack[j];
        state.rack[j] = tmp;
    }
    ui_state.redraw = true;
}


function add_generic_actions() {
    $("#actions").append('<li><a href="javascript:recall_tiles()">recall tiles</a></li>');
    $("#actions").append('<li><a href="javascript:shuffle_tiles()">shuffle tiles</a></li>');
    if (state !== null) {
        var player_list = $('<ol></ol>');
        for (var i = 0; i < state.num_players; i++) {
            player_list.append('<li>' + immutable_state.players[i].username +
                               ' - ' + state.scores[i] + '</li>');
        }
        $('#actions').append(player_list);
    }
}


function add_actions() {
    var actions = ['pass', 'swap', 'play'];
    for (var i = 0; i < 3; i++) {
        var action = actions[i];
        $("#actions").append('<li><a href="javascript:' + action + '()">' + action + '</a></li>');
    }
    add_generic_actions();
}


function add_winners() {
    $('#actions').append('<li>Game over. Winners:</li>');
    for (var i = 0; i < state.winners.length; i++) {
        var idx = state.winners[i];
        $('#actions').append('<li>' + immutable_state.players[idx].username + '</li>');
    }
}


function add_refresh() {
    $("#actions").append('<li>' + immutable_state.players[state.current_player].username + "'s turn</li>");
    $("#actions").append('<li><a href="javascript:get_state()">refresh</a></li>');
    add_generic_actions();
}


function get_state() {
    $.get('/game/' + game_id + '/state/', {},
          function (resp) {
              recall_tiles();
              state = resp;
              $("#actions").html('');
              if (state.winners.length != 0) {
                  add_winners();
              } else if (state.current_player == immutable_state.player_num) {
                  add_actions();
              } else {
                  add_refresh();
              }
              board_image = undefined;
              ui_state.redraw = true;
          });
}


// Make CSRF work with AJAX in jquery
$('html').ajaxSend(function(event, xhr, settings) {
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
        // Only send the token to relative URLs i.e. locally.
        xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
    }
});

function init(game_id_) {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    game_id = game_id_;

    $.get('/game/' + game_id + '/immutable_state/', {},
          function (resp) {
              immutable_state = resp;
              get_state();
          });

    var supportsTouch = 'createTouch' in document;
    canvas[supportsTouch ? 'ontouchstart' : 'onmousedown'] = mouse_down;
    canvas[supportsTouch ? 'ontouchmove' : 'onmousemove']  = mouse_move;
    canvas[supportsTouch ? 'ontouchend' : 'onmouseup']  = mouse_up;

    setInterval(draw, 1000 / 60);
}
