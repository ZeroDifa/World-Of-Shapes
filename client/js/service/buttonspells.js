let buttons = {}, spellsInfo;
let spells_interface = document.getElementById('spells-interface');

function buttons_init(spellsInfo) {
    for (let i = 1; i <= 10; i++) {
        let el = document.createElement("button");
        el.innerHTML = i != 10 ? i : 0
        el.setAttribute('class', 'spell-button');
        el.setAttribute('style', 'background-repeat: no-repeat; background-size: cover;')
        buttons[i != 10 ? i : 0] = {
            element: el,
            spell_id: null,
            setSpell: function (id) {
                this.spell_id = id;
                this.element.id = id;
                this.element.setAttribute('title', spellsInfo[this.spell_id]['title'])
                this.element.style.backgroundImage = 'url(static/images/spells/' + spellsInfo[id].image + ')'
                this.element.style['border'] = `none`
            }
        }
        spells_interface.appendChild(el);
    }
}

function setSpells(allow) {
    let i = 1
    for (let s of allow) {
        if (s == 'global') continue
        buttons[i++].setSpell(s);
    }
}