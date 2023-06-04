"use strict";

let LOAD = 'no', focus = true;
window.onload = () => {
    LOAD = 'ready'
    $('#settings-button').onclick = () => {
        $('#settings').css('display', $('#settings').css('display') == 'block' ? 'none' : 'block')
    }
    // console.log(performance.now())
}
const l = console.log
window.onfocus = () => {
    focus = true
    l(focus)
}
window.onblur = () => {
    focus = false;
    l(focus);
}
let canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d'),
    fps = document.getElementById('fps-counter'),
    cords = document.getElementById('myCords'),
    name = 'the no-nickname';

let wsIP = 'ws://localhost:1337',
    ws = null;
function open() {
    ws = new WebSocket(wsIP)
    ws.onopen = onopen
    ws.onclose = onclose
    ws.onerror = function () {
        new PushNotify('Connection error', 3000)
    }
    ws.onmessage = onmessage
    ws.binaryType = "arraybuffer"
}
// setTimeout(open, 100)
let mp_w = 0,
    mp_h = 0,
    spX = mp_w / 2,
    spY = mp_h / 2,
    POV = {},
    Objects = [],
    VanishObjects = [],
    UpdatableObjects = [],
    MyID = null,
    Target = null,
    w = canvas.width = window.innerWidth,
    h = canvas.height = window.innerHeight,
    SpectEasing = 0.06,
    camera = {
        x: mp_w / 2,
        y: mp_h / 2,
        xto: mp_w / 2,
        yto: mp_h / 2,
        realScale: 0.5,
        scale: 1,
        moveTo: function (x, y) { this.xto = x; this.yto = y },
        CameraMove: function () {
            camera.scale += (camera.realScale - camera.scale) * 0.05
            camera.x += (camera.xto - camera.x) * (spectating_mode ? SpectEasing : 0.13)
            camera.y += (camera.yto - camera.y) * (spectating_mode ? SpectEasing : 0.13)
            if (camera.x < 0) camera.x = 0;
            if (camera.y < 0) camera.y = 0;
            if (camera.x > mp_w) camera.x = mp_w - 0;
            if (camera.y > mp_h) camera.y = mp_h - 0;
            cords.innerHTML = Math.floor(this.x) + ' ' + Math.floor(this.y) + ' ' + wsIP
            if (hasPlayer(MyID)) cords.innerHTML += ''
        }
    };
window.ImageCache = {}
let imgSizes = {};
let totalload = 0;
let totalsize = 0;
let currentSize = 0;
function onloadImage() {
    totalload--;
    currentSize += imgSizes[this.attributes.src.value.split('/').pop()];
    let p = Math.floor(currentSize / totalsize * 100);
    $('#progress-bar').css({
        'width': p + "%"
    })
    $('#progress-bar').html(currentSize + "kb / " + totalsize + 'kb')
    if (totalload < 1) {
        $('#pb-container').addClass("d-none")
        new PushNotify("Pictures cached", 2000)
        open()
    }
}



async function getImgs() {
    let response = await fetch('../api/getimglist', {
        method: 'GET'
    });
    let json = await response.json();
    if (json['error'] == "Invalid Token") {

        window.location.href = "/signin"
    }
    totalload = json['img_list'].length + json['b_list'].length
    json['img_list'].forEach(element => {
        let i = new Image();
        i.src = `static/images/spells/${element.name}`;
        i.onload = onloadImage;
        ImageCache[element.name] = i;
        totalsize += element.filesize;
        currentSize += 20;
        imgSizes[element.name] = element.filesize
    });
    json['b_list'].forEach(element => {
        let i = new Image();
        i.src = `static/images/bonuses/${element.name}`;
        i.onload = onloadImage;
        ImageCache[element.name] = i;
        totalsize += element.filesize;
        currentSize += 20;
        imgSizes[element.name] = element.filesize
    });
}
getImgs()
let aimX = 0, aimY = 0,
    spectating_mode = true,
    isLife = false,
    isPause = true,
    freeze = false;
function setSpect() {
    spectating_mode = true;
    isLife = false;
    isPause = true;
    freeze = false;
    $('#play').css('display', 'block');
    
}
function onclose() {
    setSpect();
    POV = {};
    ws = null;
    HideInterface();
    new PushNotify('socket closed', 3000, 'red')
}
function HideInterface() {
    document.getElementById('statsInterface').style['display'] = 'none';
    document.getElementById('spells-interface').style['display'] = 'none';
}
function onopen() {
    ws.send(localStorage.token)
    ws.send(getCookie('id'));
    new PushNotify('connected', 3000, 'green')
}

let OriginPoints = [];
let viewRatio = 0, isRadialView = false;
function onmessage(event) {
    let data = event.data
    switch (typeof data) {
        case 'string':
            data = JSON.parse(data)
            switch (data.id) {
                case 'server_settings':
                    mp_h = data.h;
                    mp_w = data.w;
                    camera.moveTo(mp_h / 2, mp_w / 2);
                    viewRatio = data.ratio;
                    UpdatableObjects = data.updatableObjects
                    isRadialView = data.isR;
                    OriginPoints = [];
                    for (let i = 0; i < (mp_h * mp_w) / 15000; i++) OriginPoints.push(new Point())
                    break
                case 'target_me':
                    break
            }
            break
        default:
            let r = new Reader(new DataView(data))
            let id = r.uint8();
            let count, target, pid;
            switch (id) {
                case 1:
                    MyID = r.uint16();
                    count = r.uint8()
                    for (let i = 0; i < count; i++) {
                        buttons[i + 1].setSpell(r.uint8());
                    }
                    startGame()
                    break
                case 2:
                    count = r.uint16();
                    while (count != 0) {
                        let p = new Player(r);
                        POV[p.id] = p;
                        count--;
                    }
                    break
                case 3:
                    count = r.uint16();
                    while (count != 0) {
                        let pid = r.uint16(),
                            code = r.uint8();
                        if (pid == MyID && code == 0) HideInterface();
                        if (Target == POV[id]) {
                            Target = null;
                            ws.send(JSON.stringify({
                                cid: Target != null ? Target.id : -1,
                                id: 2
                            }));
                        }
                        if (pid == MyID && code == 0) {
                            setTimeout(setSpect, 400)
                        }
                        POV[pid].setDelete(code, r);
                        count--;
                    }
                    break
                case 4:
                    count = r.uint16()
                    for (let i = 0; i < count; i++) {
                        let t = POV[r.uint16()];
                        t.xto = r.uint16();
                        t.yto = r.uint16();
                        if (t.class == 2) {
                            t.angleTo = r.float32()
                        }
                        if (t.id == MyID) camera.moveTo(t.xto, t.yto);
                    }
                    break
                case 5:
                    POV[r.uint16()].setSpellProcess(r.uint8(), r.uint16());
                    break;
                case 6:
                    POV[MyID].setGlobalCooldown(r.uint16());
                    break;
                case 7:
                    pid = r.uint16();
                    if (hasPlayer(pid)) POV[pid].doSpell(r);
                    else doSpell(r)
                    break;
                case 8:
                    POV[MyID].setCooldown(r);
                    break
                case 9:
                    POV[MyID].breakProcess();
                    break;
                case 10:
                    pid = r.uint16()
                    if (!hasPlayer(pid)) break
                    target = POV[pid];
                    let attacker = r.uint16(),
                        dmg_value = r.int32();
                    target.reHp(dmg_value);
                    if (dmg_value > 0) {
                        if (attacker == MyID || target.id == MyID) new Damage(target, '+' + dmg_value, '#76de99')
                    } else {
                        if (target.id == MyID) new Damage(target, dmg_value, 'red');
                        else if (attacker == MyID) new Damage(target, dmg_value * (-1), 'white');
                    }
                    break
                case 11:
                    pid = r.uint16()
                    if (hasPlayer(pid)) POV[pid].reMp(r.int16())
                    break
                case 12:
                    let targ = r.uint16(),
                        efid = r.uint8(),
                        dur = r.uint16();
                    if (POV[targ] != undefined) new Effect(efid, POV[targ], dur);
                    break
                case 14:
                    document.getElementById("statsInterface")['style'].animation = 'combat 2s infinite ease-in-out'
                    break
                case 15:
                    document.getElementById("statsInterface")['style'].animation = ''
                    break
                case 16:
                    pid = r.uint16()
                    if (hasPlayer(pid)) POV[pid].reEnergy(r.int16())
                    break;
                case 17:
                    pid = r.uint16()
                    if (hasPlayer(pid)) POV[pid].hit()
                    break;
                // level system
                case 18:
                    break;
            }

    }
}
function doSpell(r) {
    let spell_id = r.uint8();
    let target;
    if (UpdatableObjects.includes(spell_id))
        new Spell(this, null, spell_id, r)
}
function hasPlayer(id) {
    return POV.hasOwnProperty(id)
}
function startGame() {
    isLife = true;
    spectating_mode = false;
    isPause = false;
    $('#play').css('display', 'none');
    zoom = 1.2;
    new PushNotify("Game Started", 1000)
    updateCameraScale();
}
function SendPacket(id) {
    if (!wsIsOpen()) return
    switch (id) {
        case 'aim':
            if (!isLife || spectating_mode) break
            ws.send(JSON.stringify({
                x: Math.floor(aimX),
                y: Math.floor(aimY),
                id: id
            }))
            break;
        case 'start':
            ws.send(JSON.stringify({
                id: id
            }))
            break;
        default:
            ws.send(JSON.stringify({ id: id }))
    }
}
let mouseX = 0, mouseY = 0;
window.onmousemove = function (event) {
    if (!spectating_mode) {
        [mouseX, mouseY] = [event.clientX, event.clientY]
        updateMouseAim()
    } else {
        [mouseX, mouseY] = [w / 2, h / 2];
        updateMouseAim()
    }
}
canvas.onmousedown = function (event) {
    let x = event.clientX, y = event.clientY;
    if (isLife) {
        updateTarget(camera.x + (x - (w / 2)) / camera.scale,
            camera.y + (y - (h / 2)) / camera.scale);
        return
    }
    camera.xto = camera.x + (x - (w / 2)) / camera.scale
    camera.yto = camera.y + (y - (h / 2)) / camera.scale

    if (wsIsOpen() && spectating_mode) {
        ws.send(JSON.stringify({
            Mx: Math.floor(camera.xto),
            My: Math.floor(camera.yto),
            id: 1
        }))
    }
}
let zoom = 0.2, size = 0, max_scale = 0.8;

function unitScale() {
    return Math.max(h / 1080, w / 1920) * zoom;
}
function updateCameraScale() {
    size = Math.pow(Math.min(64 / size, 1), 0.4) * unitScale();
    camera.realScale = size
}
document.body.onmousewheel = function (event) {
    zoom *= Math.pow(0.9, event.wheelDelta / -120 || (event.detail || 0))
    if (zoom > 2) zoom = 2;
    if (zoom < (spectating_mode ? 0.5 : max_scale)) zoom = spectating_mode ? 0.5 : max_scale;
    updateCameraScale()
}

window.addEventListener('keydown', function (event) {
    let key = event.code;
    if (key.includes("Digit")) {
        key = parseInt(key.slice(5, 6, 1))
        if (buttons[key].spell_id == null) return
        ws.send(JSON.stringify({
            spell_id: buttons[key].spell_id,
            id: 'cast'
        }))

    }
    switch (event.code) {
        case "KeyA":
            if (!isLife) break
            let min = Infinity, t = { x: -1000, y: -1000 };
            for (const id in POV) {
                if (hasPlayer(id) && hasPlayer(MyID) && id != MyID && isLife) {
                    const p = POV[id], d = new Vector2(POV[MyID], p).distance;
                    if (d < min) {
                        min = d;
                        t = p;
                    }
                }
            }
            updateTarget(t.x, t.y)
            break
    }
});
window.addEventListener('keyup', function (event) {
    l(event.code)
    switch (event.code) {
        case "Escape":
            gameMenu.style.display = gameMenu.style.display == 'block' ? 'none' : 'block';
    }
})

let result_fps = 0,
    DeltaTime = 1000 / 60;
function render() {
    drawBorders(ctx);
    for (let point of OriginPoints) point.draw();
    drawViewBar();
    for (let id in POV) {
        let p = POV[id]
        //opacity
        if (p.opacity == 0) continue
        else if (p.opacity == 1) {
            ctx.globalAlpha = 1;
        } else ctx.globalAlpha = p.opacity
        //
        p.draw()
        ctx.globalAlpha = 1
    }
    for (let obj of Objects) {
        obj.draw()
    }
    for (let obj of VanishObjects) {
        obj.draw()
    }
    drawTargetBar();
}
//render funcs
function drawViewBar() {
    if (POV[MyID] == undefined) return
    let p = POV[MyID]
    ctx.globalAlpha = 0.4
    if (isRadialView) draw_circle(p.x, p.y, viewRatio, 'transparent', true, 'gray')
    else {
        let l = viewRatio
        ctx.moveTo(p.x - l, p.y - l);
        ctx.strokeStyle = 'white';
        ctx.lineTo(p.x + l, p.y - l);
        ctx.lineTo(p.x + l, p.y + l);
        ctx.lineTo(p.x - l, p.y + l);
        ctx.lineTo(p.x - l, p.y - l);
        ctx.stroke();
    }
    ctx.globalAlpha = 1
}
function drawTargetBar() {
    if (Target != null && POV[Target.id] == undefined) Target = null;
    if (Target == null || spectating_mode || !isLife) return;
    draw_circle(Target.x, Target.y, Target.radius * 1.45, 'transparent', true, 'red')
    draw_circle(Target.x, Target.y, Target.radius * 1.5, 'transparent', true, 'red')
}

// ----
function update() {
    for (let id in POV) {
        let p = POV[id]
        p.move()
    }
    for (let obj of Objects) {
        obj.move()
    }
}
function main() {
    let now = performance.now();
    ctx.clearRect(0, 0, w, h)
    ctx.save();
    camera.CameraMove()
    ctx.translate(w / 2, h / 2)
    ctx.scale(camera.scale, camera.scale);
    ctx.translate(-camera.x, -camera.y);
    update()
    // if (focus) render()
    render()
    ctx.restore();
    result_fps++;
    let fut = performance.now() - now;
    DeltaTime = 1000 / 60 - fut;
    requestAnimationFrame(main);
}
main()

let col = 0.1;
setInterval(function () {
    fps.innerHTML = `${Math.floor(result_fps / col)}`;
    col += 0.1
    if (col > 1) {
        col = 0.1;
        result_fps = 0
    }
}, 100)
function rnd(arr) {
    arr[0] = Math.ceil(arr[0]);
    arr[1] = Math.floor(arr[1]);
    return Math.floor(Math.random() * (arr[1] - arr[0])) + arr[0];
}
function delFromArray(array, element) {
    let i = array.indexOf(element);
    if (i !== -1) { array.splice(i, 1) }
}
let anglex = 0, angley = 0;
function drawBorders(ctx) {
    draw_circle(0, 0, 1, 'white')
    ctx.moveTo(0, 0);
    ctx.strokeStyle = 'gray';
    ctx.lineTo(mp_w, 0);
    ctx.lineTo(mp_w, mp_h);
    ctx.lineTo(0, mp_h);
    ctx.lineTo(0, 0);
    ctx.stroke();
    if (POV[MyID] == undefined || true) return

    let vv = new Vector2(POV[MyID], { x: aimX, y: aimY });
    ctx.strokeStyle = 'red';
    anglex = Math.acos((aimX - POV[MyID].x) / vv.distance)
    angley = Math.asin((aimY - POV[MyID].y) / vv.distance)
    ctx.moveTo(POV[MyID].x, POV[MyID].y);
    ctx.lineTo(POV[MyID].x + 500 * Math.cos(anglex), POV[MyID].y + 500 * Math.sin(angley));
    ctx.stroke();
    ctx.strokeStyle = 'black';
    // ctx.restore()
}

function updateMouseAim() {
    if (freeze) return
    aimX = camera.x + (mouseX - (w / 2)) / camera.scale
    aimY = camera.y + (mouseY - (h / 2)) / camera.scale
    SendPacket('aim')
}
function updateTarget(x, y) {
    let old_t = Target;
    Target = null;
    let me = POV[MyID];
    if (new Vector2(me, { x: x, y: y }).distance < me.radius) {
        me.freeze = !me.freeze;
        freeze = !freeze;
        Target = old_t
        return
    }
    for (let id in POV) {
        let p = POV[id];
        if (id == MyID) continue
        if (new Vector2(p, { x: x, y: y }).distance <= p.radius * 1.5) {
            Target = p
        }
    }
    if (old_t != Target) {
        if (isLife) {
            ws.send(JSON.stringify({
                cid: Target != null ? Target.id : -1,
                id: 2
            }))
        }
    }
}
function resizeCanvas() {
    canvas.width = w = window.innerWidth;
    canvas.height = h = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas, true);
function wsIsOpen() {
    return null != ws && ws.readyState === ws.OPEN;
}
function checkBorders() {
    if (this.x < 0) this.x = 0;
    if (this.y < 0) this.y = 0;
    if (this.x > mp_w) this.x = mp_w - 0;
    if (this.y > mp_h) this.y = mp_h - 0;
}
function draw_circle(x, y, mass, fill, isStroke = false, strcolor) {
    ctx.beginPath();
    ctx.fillStyle = fill;
    ctx.arc(x, y, mass, 0, Math.PI * 2);
    ctx.fill();
    if (isStroke) {
        let was = ctx.strokeStyle;
        ctx.strokeStyle = strcolor;
        ctx.stroke();
        ctx.strokeStyle = was;
    }
}
function draw_rect(x, y, w, h, fill) {
    ctx.beginPath();
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
}
class Point {
    constructor(x = rnd([0, mp_w]), y = rnd([0, mp_h])) {
        this.x = x
        this.y = y
        this.radius = rnd([1, 10]) / 10
    }
    draw() {
        let p = POV[MyID];
        if (p == undefined) p = camera;
        if (isRadialView) {
            if (!(new Vector2(this, p).distance < viewRatio)) return;
        } else {
            if (!(this.x > p.x - viewRatio && this.x < p.x + viewRatio && this.y > p.y - viewRatio && this.y < p.y + viewRatio)) return;
        }
        draw_circle(this.x, this.y, this.radius, 'gray')
    }
}
function draw_text(x, y, name, mass, align = 'center', base = 'middle') {
    ctx.beginPath();
    ctx.font = mass + 'px Ubuntu';
    ctx.fillStyle = 'Black';
    ctx.strokeStyle = 'black';
    ctx.textAlign = align;
    ctx.textBaseline = base;
    if (typeof name == "number") name = Math.floor(name).toString();
    ctx.fillText(name, x, y);
}
class Vanish {
    constructor(object, step = 0.02, hit = function () { }) {
        this.hit = hit;
        this.step = step;
        Objects.push(this);
        this.object = object;
        this.alpha = 1;
        this.dateCreate = performance.now();
    }
    draw() {
        ctx.globalAlpha = this.alpha;
        this.object.draw();
        ctx.globalAlpha = 1;
    }
    move() {
        this.alpha -= this.step
        if (this.alpha < 0 || performance.now() - this.dateCreate > 10000) {
            delFromArray(Objects, this)
            this.hit();
            return;
        }
    }
}
let notifys = {};
class PushNotify {
    static notifyCount = 0;
    static nid = 0;
    constructor(message, duration = 1000, color = 'orange') {
        this.duration = duration;
        this.color = color
        this.repos()
        this.dateCreate = performance.now();
        this.text = message;
        Objects.push(this)
        this.nid = PushNotify.nid++
        notifys[this.nid] = (this)
        this.isStart = true
        this.yk = PushNotify.notifyCount++;
    }
    repos() {
        this.mass = 20 / camera.scale
        this.width = 200 / camera.scale
        this.height = 100 / camera.scale
        this.rangeyto = this.height / 2 + 10 * this.yk + this.height * this.yk
        this.x = (camera.x - (w / 2) / camera.scale) + this.width / 2
        if (this.isStart) {
            this.rangey = this.height / 2 + 10 * this.yk + this.height * this.yk + 100 * this.yk
            this.isStart = false
        } else {
            this.rangey += (this.rangeyto - this.rangey) * 0.15
            if (this.rangey < 0 || this.rangey == NaN) {
                this.rangey = this.height / 2 + 10 * this.yk + this.height * this.yk;
            }
        }
        this.y = (camera.y - (h / 2) / camera.scale) + this.rangey

    }
    move() {
        if (performance.now() - this.dateCreate > this.duration) {
            PushNotify.notifyCount--;
            delFromArray(Objects, this);
            new Vanish(this, 0.07, () => {
                for (let i in notifys) {
                    let el = notifys[i];
                    if (el.yk > 0 && this.yk < el.yk) el.yk -= 1;
                }
                delete notifys[this.nid]
            })
        }
    }
    draw() {
        this.repos()
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.strokeStyle = 'red';
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        draw_text(this.x, this.y, this.text, this.mass);
        ctx.stroke();
    }
}
class Fire {
    constructor(radius, maxLife, owner, speed, r, g, b, range = 0, takeoff = true, particle_function = undefined) {
        this.newP = particle_function != undefined ? particle_function.bind(this) : function () {
            this.particles.push({
                x: this.owner.x + rnd([-this.range, this.range]),
                y: this.owner.y + rnd([-this.range, this.range]),
                tx: (Math.random() * 3 * this.speed - this.speed) / 2,
                ty: 0 - Math.random() * 3 * this.speed,
                life: 0
            })
        };
        this.range = range
        this.owner = owner;
        this.takeoff = takeoff;
        this.r = r;
        this.b = b;
        this.g = g;
        this.radius = radius;
        this.particles = [];
        this.maxLife = maxLife;
        this.speed = speed;
        Objects.push(this)
    }
    draw() {

        for (let i = 0; i < this.particles.length; i++) {
            // ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${((this.maxLife-this.particles[i].life)/this.maxLife)*0.4}`;
            // console.log(ctx.fillStyle)
            // return
            ctx.fillStyle = `rgba(${260 - (this.particles[i].life * 2) - this.r},${260 - (this.particles[i].life * 2) - this.g},${260 - (this.particles[i].life * 2) - this.b},${((this.maxLife - this.particles[i].life) / this.maxLife) * 0.4}`;
            ctx.globalCompositeOperation = 'lighter'
            ctx.beginPath();
            // console.log(ctx.fillStyle)
            ctx.arc(this.particles[i].x, this.particles[i].y,
                (this.maxLife - this.particles[i].life) / this.maxLife * (this.radius / 2) + (this.radius / 2) > 0 ? (this.maxLife - this.particles[i].life) / this.maxLife * (this.radius / 2) + (this.radius / 2) : 1,
                0, 2 * Math.PI);
            ctx.fill();

            this.particles[i].x += this.particles[i].tx;
            this.particles[i].y += this.particles[i].ty + (this.takeoff ? -2 : 0);

            this.particles[i].life++;
            if (this.particles[i].life >= this.max) {
                this.particles.splice(i--, 1);
            }
            ctx.globalCompositeOperation = 'source-over'
        }
    }
    destroy(forcibly = false) {
        Objects.splice(Objects.indexOf(this), 1);
        if (forcibly) return;
        new Vanish(this, 0.01);
    }
    move() {
        for (let i = 0; i < 1; i++) this.newP();
    }
}