let canvas, ctx, w, h, player = null, aimX, aimY;
$('#canvas').ready(function () {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    canvas.width = w = canvas.clientWidth;
    canvas.height = h = canvas.clientHeight;
    main();
})
window.onmousemove = (event) => {
    [aimX, aimY] = [event.clientX, event.clientY]
    if (player) {
        player.angleTo = Math.atan2(aimY - window.innerHeight / 2, aimX - window.innerWidth / 2);

    }
}
window.onresize = () => {
    canvas.width = w = canvas.clientWidth;
    canvas.height = h = canvas.clientHeight;
    if (player) {
        player.x = w/2
        player.y = h/2
    }
}

function setPlayer(chrs, id) {
    player = new Player(chrs[id], w / 2, h / 2);
}
let frameRate = 60;
function main() {
    let now = performance.now();
    ctx.clearRect(0, 0, w, h)
    ctx.save();
    ctx.translate(w / 2, h / 2)
    ctx.scale(2.5, 2.5);
    ctx.translate(-w / 2, -h / 2)
    if (player != null) {
        player.draw();
    }

    ctx.restore();
    setTimeout(main, 1000 / frameRate)
}


class Player {
    constructor(r, x, y) {
        this.class = r['class'] == 'mage' ? 1 : 2;
        if (r['class'] == 'mage') frameRate = 4;
        else frameRate = 60;
        this.angleTo = 0
        this.angle = 0
        this.isMainPlayer = false;
        this.x = x;
        this.y = y;
        this.xto = this.x;
        this.yto = this.y;
        this.color = '#606564';
        this.radius = r['radius'];
        this.name = r['nickname'];
        this.maxHp = r['stamina'] * 10;
        this.hp = this.maxHp;
        this.level = r['level'];


        this.opacity = 1;
        this.dateToRestoreOpacity = performance.now() - 9999999
        switch (this.class) {
            case 1:
                this.maxMp = r["intelligence"] * 10;
                this.mp = this.maxMp;
                break;
            case 2:
                this.maxEnergy = r['maxEnergy']
                this.energy = this.maxEnergy;
                break
        }
        this.isCircleEffects = true;
        this.Effects = [];
        if (this.class == 2) {
            this.angle = Math.random()*Math.PI;
            this.cosA = 0;
            this.sinA = 0;
            if (this.isMainPlayer) this.viewAngle = 1;
        }
        this.spellProcesses = {};
        this.cooldowns = {};
        this.isLife = true;
        this.nameLength = 100 + (ctx.measureText(this.name).width > 100 ? ctx.measureText(this.name).width - 100 : 0);
        if (this.isMainPlayer) {
            this.freeze = false;
        }
    }
    draw() {
        if (performance.now() > this.dateToRestoreOpacity) this.opacity = 1;

        let AddAngle = 0, startAngle = this.angle;
        switch (this.class) {
            case 1:
                draw_circle(this.x, this.y, this.radius, this.freeze ? 'blue' : this.color)
                draw_circle(this.x, this.y, this.radius, 'transparent', true, 'black')
                break;
            case 2:
                var angleDiff = Math.atan2(Math.sin(this.angleTo - this.angle), Math.cos(this.angleTo - this.angle));
                this.angle += 0.09 * angleDiff;

                ctx.beginPath();
                ctx.moveTo(this.x + this.radius * Math.cos(this.angle), this.y + this.radius * Math.sin(this.angle));
                for (var i = 1; i <= 2; i++) {
                    var currentAngle = this.angle + (i * 2 * Math.PI / 3);
                    ctx.lineTo(this.x + this.radius * Math.cos(currentAngle), this.y + this.radius * Math.sin(currentAngle));
                }
                ctx.closePath();
                ctx.fillStyle = 'red'
                ctx.fill()
                ctx.stroke();
                break
        }
        this.draw_name()
        if (this.class == 2) this.drawVector()
        if (!this.isMainPlayer) this.drawHpBar()
    }
    sort(arr) {
        arr.sort((a, b) => b.time - a.time);
    }
    getAimY() {
        return this.y + this.radius * Math.sin(this.angleY)
    }
    drawVector() {
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.radius * Math.cos(this.angle), this.y + this.radius * Math.sin(this.angle));
        ctx.stroke();
        if (!this.isMainPlayer) return

        ctx.strokeStyle = `rgb(${105}, ${88}, ${88}, 0.3)`
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + viewRatio * Math.cos(this.angle + this.viewAngle),
            this.y + viewRatio * Math.sin(this.angle + this.viewAngle));
        ctx.stroke();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + viewRatio * Math.cos(this.angle - this.viewAngle),
            this.y + viewRatio * Math.sin(this.angle - this.viewAngle));
        ctx.stroke();
    }
    drawEffects() {
        let a = 35
        let MaxCount = 5;
        MaxCount = this.Effects.length > MaxCount ? MaxCount : this.Effects.length
        this.sort(this.Effects)
        for (let i = 0; i < this.Effects.length; i++) {
            let x = this.x - ((MaxCount) / 2 * a) + ((i % MaxCount) * a),
                y = this.y - 50 - (a * Math.ceil((i + 1) / MaxCount));
            if (this.Effects[i].image == undefined) continue
            ctx.drawImage(this.Effects[i].image, x, y, a, a)
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.fillText((this.Effects[i].time / 1000).toFixed(1), x + a / 2, y + a / 2);
            if (this.Effects[i].time < 50) {
                new Vanish({
                    x: this.x - ((MaxCount) / 2 * a) + ((i % MaxCount) * a), a: a,
                    y: this.y - 50 - (a * Math.ceil((i + 1) / MaxCount)),
                    image: this.Effects[i].image,
                    draw: function () {
                        this.y--
                        ctx.drawImage(this.image, this.x, this.y, this.a, this.a);
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.font = '17.5px Verdana'
                        ctx.fillStyle = 'white';
                        ctx.fillText('0.0', this.x + this.a / 2, this.y + this.a / 2);
                    },
                }, 0.1);
            }
        }
    }
    drawHpBar() {
        draw_rect(this.x - this.nameLength / 2, this.y - this.radius - 15, this.nameLength, 10, 'gray');
        ctx.strokeStyle = 'white'
        ctx.stroke()
        draw_rect(this.x - this.nameLength / 2, this.y - this.radius - 15, this.nameLength * this.hp / this.maxHp, 10, 'red');
        draw_rect(this.x - this.nameLength / 2, this.y - this.radius - 5, this.nameLength, 10, 'gray');
        ctx.strokeStyle = 'white'
        ctx.stroke()
        if (this.class == 1) draw_rect(this.x - this.nameLength / 2, this.y - this.radius - 5, this.nameLength * this.mp / this.maxMp, 10, 'blue');
        if (this.class == 2) draw_rect(this.x - this.nameLength / 2, this.y - this.radius - 5, this.nameLength * this.energy / this.maxEnergy, 10, 'orange');
        ctx.beginPath()
        ctx.fillStyle = 'black';
        ctx.textAlign = 'start';
        ctx.textBaseline = "top";
        ctx.font = 10 + 'px Verdana';
        ctx.fillText(`${this.hp}/${this.maxHp}`, this.x - this.nameLength / 2, this.y - this.radius - 15);
        if (this.class == 1) ctx.fillText(`${this.mp}/${this.maxMp}`, this.x - this.nameLength / 2, this.y - this.radius - 5)
        if (this.class == 2) ctx.fillText(`${this.energy}/${this.maxEnergy}`, this.x - this.nameLength / 2, this.y - this.radius - 5)
    }
    draw_name(align = 'center', base = 'middle') {
        ctx.beginPath();
        ctx.font = this.radius * 0.5 + 'px Verdana';
        ctx.fillStyle = 'gray';
        ctx.textAlign = align;
        ctx.textBaseline = base;
        if (typeof name == "number") name = Math.floor(name);
        if (!this.isMainPlayer) {
            ctx.fillText(this.name, this.x, this.y - this.radius * 1.7);

            // ctx.drawImage(ImageCache['star.png'], this.x-ctx.measureText(this.name).width/2-30, this.y - this.radius - 30*1.5, 30, 30)

            ctx.fillText(this.level, this.x - ctx.measureText(this.name).width / 2 - 30 / 2, this.y - this.radius - 27.5);

        }
        if (this.freeze) ctx.fillText('click me!', this.x, this.y);
    }
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