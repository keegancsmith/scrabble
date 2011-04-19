var canvas;
var ctx;
var game_id;

// Game Logic State -- Fetched from Server
var immutable_state = null;
var state = null;

// UI State
var ui_state = {
    'redraw': true,
    'selected_tile': null,
    'selected_tile_pos': null,
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

    for (var i = 0; i < 15; i++) {
        for (var j = 0; j < 15; j++) {
            var k = make_key(i, j);

            if (state !== null && k in state.board) {
                draw_tile(state.board[k], i * cell_size, j * cell_size);
                continue;
            } else if (k in ui_state.rack_tiles_on_board) {
                var idx = ui_state.rack_tiles_on_board[k];
                draw_tile(state.rack[idx], i * cell_size, j * cell_size);
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
    for (var i = 0; i <= 15; i++) {
        var offset = i * cell_size;
        draw_line(offset, 0, offset, 15 * cell_size);
        draw_line(0, offset, 15 * cell_size, offset);
    }
}


function draw_tile(c, x, y) {
    var cell_size = ui_immutable_state.cell_size;

    ctx.fillStyle = '#deb887';
    ctx.fillRect(x, y, cell_size, cell_size);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(c, x + cell_size / 2, y + cell_size / 2);
}


function draw_rack() {
    var cell_size = ui_immutable_state.cell_size;

    if (state === null) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Loading game...', cell_size * 7 / 2, cell_size / 2);
        return;
    }

    for (var i = 0; i < state.rack.length; i++)
        if (i != ui_state.selected_tile &&
            !(i in ui_state.rack_tiles_on_board_idx))
            draw_tile(state.rack[i], i * cell_size, 0);

    ctx.strokeStyle = '#f5deb3';
    ctx.lineWidth = 2;
    draw_line(0, 0, 7 * cell_size, 0);
    draw_line(0, cell_size, 7 * cell_size, cell_size);
    for (var i = 0; i <= 7; i++)
        draw_line(i * cell_size, 0, i * cell_size, cell_size);
}


function draw() {
    if (!ui_state.redraw)
        return;

    ui_state.redraw = false;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(ui_immutable_state.board_offset[0],
                  ui_immutable_state.board_offset[1]);
    draw_board();
    ctx.restore();

    ctx.save();
    ctx.translate(ui_immutable_state.rack_offset[0],
                  ui_immutable_state.rack_offset[1]);
    draw_rack();
    ctx.restore();

    if (ui_state.selected_tile !== null)
        draw_tile(state.rack[ui_state.selected_tile],
                  ui_state.selected_tile_pos.x - ui_immutable_state.cell_size / 2,
                  ui_state.selected_tile_pos.y - ui_immutable_state.cell_size / 2);
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
    if (x > 6 || y > 1)
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
}


function mouse_up(e) {
    if (ui_state.selected_tile === null)
        return;

    var i = ui_state.selected_tile;
    var p = getCursorPosition(e);
    var v = position_in_board(p);

    ui_state.selected_tile = null;
    ui_state.redraw = true;

    if (v === null)
        return;

    var k = make_key(v.x, v.y);
    if (k in ui_state.rack_tiles_on_board || k in state.board)
        return;

    ui_state.rack_tiles_on_board[k] = i;
    ui_state.rack_tiles_on_board_idx[i] = k;
    ui_state.redraw = true;
}


function mouse_move(e) {
    if (ui_state.selected_tile === null)
        return;

    ui_state.selected_tile_pos = getCursorPosition(e);
    ui_state.redraw = true;
}


function pass() {
    // TODO
    console.log("pass");
}


function swap() {
    // TODO
    console.log("swap");
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
              console.log(resp);
              ui_state.redraw = true;
              get_state();
          });
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
