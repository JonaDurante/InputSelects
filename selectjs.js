//--------------- Eventos del Dom
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        ulElement.style.display = "none";
    }
});

document.addEventListener('click', function (event) {
    const clickedOutsideUl = !ulElement.contains(event.target);
    const clickedButton = event.target.tagName === 'BUTTON' && !ulElement.contains(event.target);
    if (clickedOutsideUl && !clickedButton) {
        ulElement.style.display = 'none';
    }
}); //si hace clik fuera del botón o de la ul que se cierren las ul
//--------------- Listeners globales para los selects
function listeners() {
    DataObjectSelect.forEach(item => {
        let AllInputElement = document.getElementById(item.Id);
        let GenericInputListener = function (event) {
            searchAndAutocomplete(item.Id);
        };
        AllInputElement.addEventListener('input', GenericInputListener);

        let inputElement = document.getElementById(item.Id);
        inputListener = function (event) {
            agregarListeners(item.Id);
            ActionOfSelect(event);
        };
        inputElement.addEventListener('keydown', inputListener);

        let clearOtherUl = function (event) {
            const inputId = event.target.id;
            OcultarUls(inputId)
        }
        AllInputElement.addEventListener('focus', clearOtherUl);

        // Este es un caso particular en el que el select zona tiene que desencadenar una acciónespecífica al cambiar
        // if (item.Id === "zona") {   
        //     let inputZona = document.getElementById("zona");
        //     let inputUbicacion = document.getElementById("ubicacion");
        //     function clearUbicacion() {
        //         inputUbicacion.value = "";
        //     }
        //     inputZona.addEventListener('input', clearUbicacion);
        // }
    });
}
//--Carga los select ni bien inicia l página
function LoadSelects() { 
    DataObjectSelect.forEach(obj => {
        searchAndAutocomplete(obj.Id);
    });
};
// Filtra ubicación por zona y si no hay zona por depósito
function UbicacionFilterByZonaOrDeposito() {
    let codigo_zona = document.getElementById("zona").value;
    let ubicaciones;
    if (codigo_zona) {
        let id_zona = data.zonas.filter(zona => zona.Codigo == parseInt(codigo_zona))
        ubicaciones = data.ubicaciones.filter(ubicacion => ubicacion.IdZona === id_zona[0].Id);
    } else if (_depo) {
        let ids_zonas = data.zonas.filter(zona => zona.IdDeposito === _depo.Id).map(zona => zona.Id);;
        ubicaciones = data.ubicaciones.filter(ubicacion => ids_zonas.includes(ubicacion.IdZona));
    } else { ubicaciones = data.ubicaciones; }

    return ubicaciones;
} 
// Filtra zona por depósito
function ZonaFilterByDeposito() {
    let Zonas = null;
    if (_depo) {
        Zonas = data.zonas.filter(element => element.IdDeposito == _depo.Id);
    } else { Zonas = data.zonas; }
    return Zonas;
}
// Cada vez que hacemos foco en un input se setean input element y ul para trabajarlos sincronizados y ahorrarnos problemas
function functionOnFocus(id) {
    inputElement = document.getElementById(id);
    ulElement = document.getElementById("ul_" + id);
    inputElement.focus();
}

let inputListener = null;
let aListeners = [];
let inputElement = null;
let ulElement = null;
let aElements = [];
// Función del botón de los select.
function openAutocompleteMenu(inputId) {
    searchAndAutocomplete(inputId, true)
    document.getElementById(inputId).focus();
    if (ulElement.style.display === "block") {
        updateSelectedItem(+1)
    }
}
// lógica de los select
function searchAndAutocomplete(inputId, button = false) {
    inputElement = document.getElementById(inputId);
    ulElement = document.getElementById("ul_" + inputId);
    let search = inputElement.value.toLowerCase();
    if (search.includes("-")) {
        search = search.split("-")[0].trim(); // Si tiene Guiòn es porque ya pasò por acà entonces tiene el formato item - item - item
    }                                         // entonces .split("-")[0] nos devuelve el còdigo del item.
    if (button) { search = "" }

    var dataArray = [];
    switch (inputId) {
        case "zona":
            dataArray = DataObjectSelect[5].array()  // llamamos a la función del obj para que los datos del array se recalculen cuando se solicitan.
            break;
        default:
            dataArray = DataObjectSelect.find(item => item.Id === inputId).array;
            break;
    }

    var fields = DataObjectSelect.find(item => item.Id === inputId).fields;

    let result = [];
    if (search.toString() != "") {
        result = dataArray.filter((item) =>
            fields.some((field) => item[field].toString().toLowerCase().includes(search))
        );
    } else { result = dataArray }

    let dataForLiElement = concatValue(inputId, result); // concateno los valores para mostrar en el select

    let elementHtml = "";
    if (dataForLiElement.length != 0) {
        elementHtml = dataForLiElement.map((data) =>
            "<li><a class='dropdown-item' href='#'>" + data + "</a></li>").join("");
    } else {
        elementHtml = "<li tabindex='-1'><a tabindex='-1' class='dropdown-item' href='#'>No se han encontrado coincidencias.</a></li>";
    }
    ulElement.innerHTML = elementHtml;

    if (button) {
        ulElement.style.display = (ulElement.style.display === "block") ? "none" : "block";
    }
    OcultarUls(inputId) //Oculto los ul que no correspondan al input para evitar acomplamiento

    agregarListeners(inputId) 
};

function concatValue(inputId, result) {
    let dataForLiElement;
    switch (inputId) {
        case "inputCliente":
            dataForLiElement = result.map((item) => `${item.Codigo} - ${item.Nombre}- ${item.Dni}`);
            break;
        default:
            dataForLiElement = result.map((item) => `${item.Codigo} - ${item.Detalle}`);
            break;
    }
    return dataForLiElement;
}

var selectedIdx = -1;
// Eventos para los a que se encuentran dentro de las li que conforman a la ul activa
function agregarListeners(inputId) {
    QuitarListener(inputId)
    aElements = ulElement.querySelectorAll('a');

    aElements.forEach(anchor => {
        const listener = function (event) {
            event.preventDefault();
            const value = this.textContent;
            inputElement.value = value;
            ulElement.style.display = "none";
            const focusedElement = document.querySelector('.aSelected');
            focusedElement.classList.remove("aSelected");
            if (inputId === "ProductosList") { cambiar_producto(); };
        };
        anchor.addEventListener('click', listener);
        aListeners.push({ anchor, listener });

        const aKeyDownListener = function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                clickListener.call(anchor, event); // Llamar al listener de clic
            }else if (event.key === 'Tab') {
                event.preventDefault();
            }
        };
        anchor.addEventListener('keydown', aKeyDownListener);
        aListeners.push({ anchor, aKeyDownListener });
    });
}
// quita eventos de la anterior ul para evitar acomplamiento
function QuitarListener(inputId) {
    aElements = ulElement.querySelectorAll('a');
    aListeners.forEach(({ anchor, listener }) => {
        anchor.removeEventListener('click', listener);
    });
    aListeners = [];
}

function OcultarUls(inputId) {
    DataObjectSelect.forEach(element => {
        if (element.Id != inputId) {
            let ul = document.getElementById("ul_" + element.Id);
            ul.style.display = "none";
        }
    })
}
// eventos de los selects
function ActionOfSelect(event) {
    if (event.key === 'Tab' || event.key === 'Enter') {
        const focusedElement = document.querySelector('.aSelected');
        if (focusedElement) {
            if (focusedElement.tagName === 'A') {
                event.preventDefault();
                const value = focusedElement.textContent;
                focusedElement.classList.remove("aSelected");
                inputElement.value = value;
                ulElement.style.display = "none";
                if (inputElement.id === "ProductosList") { cambiar_producto(); };
            }
        }
    } else if (event.keyCode === 40) { // "ArrowDown"
        event.preventDefault();
        updateSelectedItem(+1);
    } else if (event.keyCode === 38) { // "ArrowUp"
        event.preventDefault();
        updateSelectedItem(-1);
    }
}
// Itera sobre los items de la ul
function updateSelectedItem(direction) {
    aElements = ulElement.querySelectorAll('a');
    selectedIdx = Array.from(aElements).findIndex(anchor => anchor.classList.contains('aSelected'));
    selectedIdx = selectedIdx < 0 ? 0 : selectedIdx + direction
    if (selectedIdx < 0) {
        ulElement.style.display = "none";
    } else { ulElement.style.display = "block"; }

    aElements.forEach((anchor, index) => {
        if (index === selectedIdx) {
            anchor.classList.add("aSelected");
        } else { anchor.classList.remove("aSelected"); }
    });

    const focusedElement = document.querySelector('.aSelected');
    // Scroll al elemento seleccionado si está fuera de la vista
    if (focusedElement) {
        const elementTop = focusedElement.offsetTop - ulElement.offsetTop;
        const elementBottom = elementTop + focusedElement.offsetHeight;
        const listTop = ulElement.scrollTop;
        const listBottom = ulElement.scrollTop + ulElement.offsetHeight;

        if (elementTop < listTop) {
            ulElement.scrollTop = elementTop;
        } else if (elementBottom > listBottom) {
            ulElement.scrollTop = ulElement.scrollTop + (elementBottom - listBottom);
        }
    }
}
//--------------------------------------------------