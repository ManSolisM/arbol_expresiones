const arbol = document.getElementById("contenido_arbol");
const btn = document.getElementById("btn_generar");

// Prioridades de operadores
const precedencia = {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2
};

// Validar paréntesis balanceados
function validarParentesis(expr) {
    let contador = 0;
    for (let char of expr) {
        if (char === '(') {
            contador++;
        } else if (char === ')') {
            contador--;
            if (contador < 0) return false; // Paréntesis de cierre sin apertura
        }
    }
    return contador === 0; // Deben estar balanceados
}

// Validar sintaxis de la expresión
function validarSintaxis(expr) {
    // 1. Verificar que solo contenga caracteres válidos
    if (!/^[\d+\-*/() ]+$/.test(expr)) {
        return "La expresión contiene caracteres inválidos";
    }

    // 2. Verificar paréntesis balanceados
    if (!validarParentesis(expr)) {
        return "Los paréntesis no están balanceados";
    }

    // 3. Verificar que no haya operadores consecutivos
    if (/[+\-*/]{2,}/.test(expr)) {
        return "No puede haber operadores consecutivos";
    }

    // 4. Verificar que no termine con un operador
    if (/[+\-*/]$/.test(expr.trim())) {
        return "La expresión no puede terminar con un operador";
    }

    // 5. Verificar que no comience con un operador (excepto -)
    if (/^[+*/]/.test(expr.trim())) {
        return "La expresión no puede comenzar con +, * o /";
    }

    // 6. Verificar paréntesis vacíos
    if (/\(\s*\)/.test(expr)) {
        return "No puede haber paréntesis vacíos";
    }

    // 7. Verificar números seguidos de paréntesis de apertura sin operador
    if (/\d\s*\(/.test(expr)) {
        return "Falta un operador entre número y paréntesis";
    }

    // 8. Verificar paréntesis de cierre seguidos de números sin operador
    if (/\)\s*\d/.test(expr)) {
        return "Falta un operador después del paréntesis de cierre";
    }

    // 9. Verificar paréntesis de cierre seguidos de paréntesis de apertura
    if (/\)\s*\(/.test(expr)) {
        return "Falta un operador entre paréntesis";
    }

    // 10. Verificar que no empiece o termine con paréntesis sin contenido válido
    if (/^\s*[+\-*/]/.test(expr.replace(/^\(+/, '').replace(/\)+$/, ''))) {
        return "Expresión inválida después de paréntesis";
    }

    return null; // No hay errores
}

// Convertir a Postfix usando Shunting Yard
function infixAPostfix(expr) {
    const output = [];
    const stack = [];
    const tokens = expr.match(/\d+|[+\-*/()]/g);

    if (!tokens) {
        throw new Error("No se pudieron extraer tokens válidos");
    }

    tokens.forEach(token => {
        if (!isNaN(token)) {
            output.push(token);
        } else if ("+-*/".includes(token)) {
            while (stack.length > 0 &&
                   "+-*/".includes(stack[stack.length - 1]) &&
                   precedencia[token] <= precedencia[stack[stack.length - 1]]) {
                output.push(stack.pop());
            }
            stack.push(token);
        } else if (token === "(") {
            stack.push(token);
        } else if (token === ")") {
            while (stack.length && stack[stack.length - 1] !== "(") {
                output.push(stack.pop());
            }
            if (stack.length === 0) {
                throw new Error("Paréntesis no balanceados");
            }
            stack.pop(); // Eliminar el paréntesis de apertura
        }
    });

    // Vaciar la pila
    while (stack.length > 0) {
        if ("()".includes(stack[stack.length - 1])) {
            throw new Error("Paréntesis no balanceados");
        }
        output.push(stack.pop());
    }

    return output;
}

// Construir árbol desde postfix
let nodeId = 0;
function construirArbol(postfix) {
    const stack = [];

    postfix.forEach(token => {
        if (!isNaN(token)) {
            stack.push({
                id: `n${nodeId++}`,
                valor: token,
                izq: null,
                der: null
            });
        } else {
            if (stack.length < 2) {
                throw new Error("Expresión inválida: operador sin suficientes operandos");
            }
            const der = stack.pop();
            const izq = stack.pop();
            stack.push({
                id: `n${nodeId++}`,
                valor: token,
                izq,
                der
            });
        }
    });

    if (stack.length !== 1) {
        throw new Error("Expresión inválida: demasiados operandos");
    }

    return stack.pop();
}

// Visualizar el árbol (recursivo)
function renderArbol(nodo, nivel = 0, pos = 0, parent = null) {
    if (!nodo) return;

    const div = document.createElement("div");
    div.className = "nodo text-center";
    div.style.position = "absolute";
    div.style.top = `${nivel * 100}px`;
    div.style.left = `${pos * 80 + 400}px`;

    div.innerHTML = `<span id="${nodo.id}" class="btn btn-${isNaN(nodo.valor) ? "primary" : "success"} rounded-circle">${nodo.valor}</span>`;
    arbol.appendChild(div);

    if (parent) {
        new LeaderLine(
            document.getElementById(parent.id),
            document.getElementById(nodo.id),
            { color: "blue", path: "straight" }
        );
    }

    renderArbol(nodo.izq, nivel + 1, pos - 1.5 ** (3 - nivel), nodo);
    renderArbol(nodo.der, nivel + 1, pos + 1.5 ** (3 - nivel), nodo);
}

btn.addEventListener("click", () => {
    arbol.innerHTML = "";
    nodeId = 0;
    const expresion = document.getElementById("expresion").value.replace(/\s+/g, '');
    // Validar que no esté vacía
    if (!expresion.trim()) {
        alert("Por favor ingresa una expresión matemática.");
        return;
    }
    // Validar sintaxis
    const errorSintaxis = validarSintaxis(expresion);
    if (errorSintaxis) {
        alert(`Error: ${errorSintaxis}`);
        return;
    }
    try {
        const postfix = infixAPostfix(expresion);
        const raiz = construirArbol(postfix);
        renderArbol(raiz);
    } catch (e) {
        alert(`Error al procesar la expresión: ${e.message}`);
    }
});