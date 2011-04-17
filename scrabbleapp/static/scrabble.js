var canvas;
var ctx;

// Game Logic State -- Fetched from Server
var immutable_state = null;
var state = null;

// UI State
var ui_state = {
    'redraw': true,
    'selected_tile': null,
    'selected_tile_pos': null
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
            var k = i + ',' + j;
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
        if (i != ui_state.selected_tile)
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
    if (ui_state.selected_tile !== null)
        return;

    var p = getCursorPosition(e);
    var i = position_in_rack(p);

    if (i == null)
        return

    ui_state.selected_tile = i;
    ui_state.selected_tile_pos = p;
    ui_state.redraw = true;
}


function mouse_up(e) {
    if (ui_state.selected_tile === null)
        return;

    var p = getCursorPosition(e);
    var v = position_in_board(p);

    // TODO implement placing
    console.log('Placed tile ' + state.rack[ui_state.selected_tile] + ' at (' + v.x + ', ' + v.y + ')');
    ui_state.selected_tile = null;
    ui_state.redraw = true;
}


function mouse_move(e) {
    if (ui_state.selected_tile == null)
        return;

    ui_state.selected_tile_pos = getCursorPosition(e);
    ui_state.redraw = true;
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

function init(game_id) {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    $.get('/game/' + game_id + '/state/', {},
          function (resp) {
              state = resp;
              ui_state.redraw = true;
          });

    $.get('/game/' + game_id + '/immutable_state/', {},
          function (resp) {
              immutable_state = resp;
              ui_state.redraw = true;
          });

    var supportsTouch = 'createTouch' in document;
    canvas[supportsTouch ? 'ontouchstart' : 'onmousedown'] = mouse_down;
    canvas[supportsTouch ? 'ontouchmove' : 'onmousemove']  = mouse_move;
    canvas[supportsTouch ? 'ontouchend' : 'onmouseup']  = mouse_up;

    setInterval(draw, 1000 / 60);
}
