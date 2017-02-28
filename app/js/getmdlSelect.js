const getmdlSelect = {
    defaultValue : {
        width: 300
    },
    addEventListeners: function (dropdown, update) {
        const input = dropdown.querySelector('input');
        const list = dropdown.querySelectorAll('li');
        const menu = dropdown.querySelector('.mdl-js-menu');

        if (!update) {
            //show menu on mouse down or mouse up
            input.onkeydown = function (event) {
                if (event.keyCode == 38 || event.keyCode == 40) {
                    menu['MaterialMenu'].show();
                }
            };

            //return focus to input
            menu.onkeydown = function (event) {
                if (event.keyCode == 13) {
                    input.focus();
                }
            };
        }

        [].forEach.call(list, function (li) {
            li.onclick = function () {
                if (!li.getAttribute('disabled')) {
                    input.value = li.textContent.split('(')[0]; // Don't include text in parenthesis

                    dropdown.MaterialTextfield.change(input.value); // handles css class changes
                    setTimeout( function() {
                        dropdown.MaterialTextfield.updateClasses_(); //update css class
                        menu['MaterialMenu'].hide();
                    }, 250 );

                    // update input with the "id" value
                    input.dataset.val = li.dataset.val || '';

                    if ("createEvent" in document) {
                        var evt = document.createEvent("HTMLEvents");
                        evt.initEvent("change", false, true);
                        input.dispatchEvent(evt);
                    } else {
                        input.fireEvent("onchange");
                    }
                }
            };
        });
    },
    init: function (selector, widthDef) {
        const dropdowns = document.querySelectorAll(selector);
        [].forEach.call(dropdowns, function (i) {
            getmdlSelect.addEventListeners(i);
            const width = widthDef ? widthDef : (i.querySelector('.mdl-menu').offsetWidth ? i.querySelector('.mdl-menu').offsetWidth : getmdlSelect.defaultValue.width);
            i.style.width = width + 'px';

            console.log('width', width);
        });
    }
};

export default getmdlSelect;