const InteractableType = { PHOTO: 'photo', DIARY: 'diary', WHISPER: 'whisper', DOOR: 'door', KEY: 'key' };
const InteractableState = { available: 'available', taken: 'taken', completed: 'completed' };

class Interactable {
  constructor(data) {
    this.x = data.x; this.y = data.y;
    this.type = data.type; this.name = data.name;
    this.icon = data.icon;
    this.state = InteractableState.available;
    this.requiredChar = data.char;
    this.dialog = data.dialog;
    this.collectible = data.collectible || false;
  }
  take() {
    if (this.collectible && this.state === InteractableState.available) {
      this.state = InteractableState.taken;
      return true;
    }
    return false;
  }
  isAvailable(char) {
    if (this.state === InteractableState.taken) return false;
    if (this.requiredChar !== 'Any' && this.requiredChar !== char) return false;
    return true;
  }
}

// ── CAPÍTULO 1: La Casa ──────────────────────────────────────────────────────
const INTERACTABLES_CAP1 = [
  // Planta baja
  { x: 2,  y: 2,  floor: 0, type: InteractableType.PHOTO,   name: 'Foto Campamento',  icon: '📸', char: 'Lucas', collectible: true,
    dialog: ['Lucas: "River Strid, último verano"... está escrita al dorso.', 'Lucas: Reconozco a Álex en la foto. Y a alguien más...'] },
  { x: 13, y: 2,  floor: 0, type: InteractableType.DIARY,   name: 'Diario Viejo',     icon: '📖', char: 'Lucas', collectible: true,
    dialog: ['Lucas: Un diario... las páginas están arrancadas.', 'Lucas: Solo queda una entrada: "No vayas al río de noche."'] },
  { x: 2,  y: 10, floor: 0, type: InteractableType.WHISPER, name: 'Rincón Oscuro',    icon: '👁️', char: 'Sofía', collectible: false,
    dialog: ['Sofía: (cierra los ojos)... escucho... pasos...', 'Sofía: "Cabaña... madera quemada... él sigue aquí..."', 'Sofía: ¡No! Se fue... pero dejó algo. Busca arriba, Lucas.'] },
  { x: 17, y: 10, floor: 0, type: InteractableType.WHISPER, name: 'Ventana Rota',     icon: '🌀', char: 'Sofía', collectible: false,
    dialog: ['Sofía: El viento... no es viento. Algo respira del otro lado.', 'Sofía: "Campamento... ve al campamento antes del amanecer..."'] },
  { x: 7,  y: 13, floor: 0, type: InteractableType.KEY,     name: 'Llave Oxidada',    icon: '🔑', char: 'Lucas', collectible: true,
    dialog: ['Lucas: Una llave vieja debajo de la alfombra.', 'Lucas: Tiene grabado "R.S." ... River Strid.'] },
  { x: 18, y: 18, floor: 0, type: InteractableType.DOOR,    name: 'Puerta Principal', icon: '🚪', char: 'Any',   collectible: false,
    dialog: ['Sofía: "Álex quiere que vayamos al campamento."', 'Lucas: "Necesitamos la foto y la llave para salir."'] },
  // Segundo piso
  { x: 7,  y: 6,  floor: 1, type: InteractableType.WHISPER, name: 'Espejo Roto',      icon: '🪞', char: 'Sofía', collectible: false,
    dialog: ['Sofía: El espejo... veo algo detrás de mí.', 'Sofía: Una figura. Una mujer. Nos mira.', 'Sofía: (grita) ¡Lucas!'] },
  { x: 7,  y: 2,  floor: 1, type: InteractableType.DIARY,   name: 'Cartas Ocultas',   icon: '✉️', char: 'Lucas', collectible: true,
    dialog: ['Lucas: Cartas escondidas bajo el tablón.', 'Lucas: Son de Álex. Habla de "la mujer del río" que lo llama cada noche.'] },
  { x: 12, y: 2,  floor: 1, type: InteractableType.PHOTO,   name: 'Retrato Familiar', icon: '🖼️', char: 'Any',   collectible: false,
    dialog: ['Lucas: Un retrato familiar... la casa era de alguien.', 'Sofía: La mujer del centro... la reconozco. La vi en el espejo.'] }
];

// ── CAPÍTULO 2: El Campamento (protagonista: Sofía) ─────────────────────────
const INTERACTABLES_CAP2 = [
  // Sofía siente — whispers que revelan la historia y desbloquean pistas
  { x: 9,  y: 7,  floor: 0, type: InteractableType.WHISPER, name: 'Fogata Apagada',
    icon: '🔥', char: 'Sofía', collectible: false,
    dialog: [
      'Sofía: (pone las manos sobre las cenizas)',
      'Sofía: Todavía hay calor... Álex estuvo aquí esta noche.',
      'Sofía: Siento su miedo. Algo lo asustó y salió corriendo hacia el norte.'
    ]
  },
  { x: 1,  y: 16, floor: 0, type: InteractableType.WHISPER, name: 'Tienda Rasgada',
    icon: '⛺', char: 'Sofía', collectible: false,
    dialog: [
      'Sofía: (toca la tela rasgada desde adentro)',
      'Sofía: No fue un animal. Veo... una mano. Desde afuera.',
      'Sofía: "Ven al río... ven al río..." — alguien lo llamaba.'
    ]
  },
  { x: 10, y: 12, floor: 0, type: InteractableType.WHISPER, name: 'Árbol Marcado',
    icon: '🌲', char: 'Sofía', collectible: false,
    dialog: [
      'Sofía: Estas marcas... son de uñas. Muchas manos.',
      'Sofía: No solo Álex. Otros vinieron antes.',
      'Sofía: El río los llama a todos. Siempre los llama.'
    ]
  },
  { x: 17, y: 4,  floor: 0, type: InteractableType.WHISPER, name: 'Ropa de Álex',
    icon: '👕', char: 'Sofía', collectible: false,
    dialog: [
      'Sofía: Su chaqueta... la dejó aquí a propósito.',
      'Sofía: (cierra los ojos) Veo el río. Él entró voluntariamente.',
      'Sofía: No... no fue voluntario. Algo lo atrajo. Una voz.'
    ]
  },

  // Sofía recoge — objetos que solo ella puede encontrar/sentir
  { x: 5,  y: 5,  floor: 0, type: InteractableType.KEY,     name: 'Diario de Álex',
    icon: '📓', char: 'Sofía', collectible: true,
    dialog: [
      'Sofía: Un diario escondido bajo las piedras.',
      'Sofía: Solo yo podía sentir dónde estaba.',
      'Sofía: (lee) "Escucho una mujer cantando desde el río cada noche. Esta noche voy a buscarla."'
    ]
  },
  { x: 3,  y: 13, floor: 0, type: InteractableType.PHOTO,   name: 'Amuleto Roto',
    icon: '🧿', char: 'Sofía', collectible: true,
    dialog: [
      'Sofía: Un amuleto... partido en dos.',
      'Sofía: Álex lo llevaba siempre. Decía que lo protegía.',
      'Sofía: Ya no lo protege. Pero quizás nos proteja a nosotros.'
    ]
  },

  // Lucas — solo un objeto, rol de apoyo
  { x: 17, y: 16, floor: 0, type: InteractableType.DIARY,   name: 'Mochila de Álex',
    icon: '🎒', char: 'Lucas', collectible: true,
    dialog: [
      'Lucas: La mochila de Álex. Está abierta.',
      'Lucas: Hay una nota: "Si lees esto, ya es tarde para mí."',
      'Lucas: (a Sofía) ¿Puedes sentir algo de esto?'
    ]
  },

  // Puerta de salida — requiere que Sofía haya encontrado sus dos objetos
  { x: 10, y: 18, floor: 0, type: InteractableType.DOOR,    name: 'Sendero al Río',
    icon: '🌊', char: 'Any',   collectible: false,
    dialog: [
      'Sofía: El sendero baja al río. Lo siento en los huesos.',
      'Lucas: ¿Estás segura de que debemos ir?',
      'Sofía: Álex está ahí. Y yo soy la única que puede encontrarlo.'
    ]
  }
];

// ── CAPÍTULO 3: El Río (mapa 40×40) ─────────────────────────────────────────
const INTERACTABLES_CAP3 = [
  // ── LUCAS (4 objetos) ────────────────────────────────────────────────────
  { x: 35, y: 3,  floor: 0, type: InteractableType.DIARY,   name: 'Diario Final',
    icon: '📓', char: 'Lucas', collectible: true,
    dialog: [
      'Lucas: Un diario viejo atado a un árbol.',
      'Lucas: "River Strid se lleva a quien entra. No hay retorno. Solo hay olvido."',
      'Lucas: Esto lleva décadas aquí.'
    ]
  },
  { x: 3,  y: 9,  floor: 0, type: InteractableType.KEY,     name: 'Cuerda Salvavidas',
    icon: '🪢', char: 'Lucas', collectible: true,
    dialog: [
      'Lucas: Una cuerda atada a un árbol en la orilla.',
      'Lucas: Alguien intentó rescatar a alguien... o escapar.',
      'Lucas: La llevo. Puede servir.'
    ]
  },
  { x: 30, y: 23, floor: 0, type: InteractableType.PHOTO,   name: 'Foto de Álex',
    icon: '🖼️', char: 'Lucas', collectible: true,
    dialog: [
      'Lucas: Una foto reciente de Álex... en la orilla.',
      'Lucas: Está sonriendo. No sabía lo que le esperaba.',
      'Sofía: (susurra) Él estuvo aquí. Lo siento.'
    ]
  },
  { x: 8,  y: 26, floor: 0, type: InteractableType.DIARY,   name: 'Mapa del Río',
    icon: '🗺️', char: 'Lucas', collectible: true,
    dialog: [
      'Lucas: Un mapa dibujado a mano. Marca una zona del río.',
      'Lucas: "Aquí desaparecieron. Aquí los encontrarás."',
      'Lucas: Alguien sabía lo que pasaría.'
    ]
  },

  // ── SOFÍA (4 objetos) ────────────────────────────────────────────────────
  { x: 5,  y: 4,  floor: 0, type: InteractableType.WHISPER, name: 'Voz del Río Norte',
    icon: '💧', char: 'Sofía', collectible: false,
    dialog: [
      'Sofía: (se detiene en seco)',
      'Sofía: El río... habla. Escucho a Álex.',
      'Sofía: "Ayúdenme... no puedo salir... el río no me suelta..."'
    ]
  },
  { x: 19, y: 7,  floor: 0, type: InteractableType.WHISPER, name: 'Tienda Abandonada',
    icon: '⛺', char: 'Sofía', collectible: false,
    dialog: [
      'Sofía: (toca los restos de la tienda)',
      'Sofía: Alguien acampó aquí hace poco. Siento su miedo.',
      'Sofía: Huyeron hacia el río de noche. No volvieron.'
    ]
  },
  { x: 25, y: 25, floor: 0, type: InteractableType.KEY,     name: 'Amuleto del Río',
    icon: '🧿', char: 'Sofía', collectible: true,
    dialog: [
      'Sofía: Un amuleto colgado en las ruinas.',
      'Sofía: Vibra entre mis manos... hay energía aquí.',
      'Sofía: Esto protegía a alguien. Ya no lo protege.'
    ]
  },
  { x: 10, y: 35, floor: 0, type: InteractableType.WHISPER, name: 'Presencia en el Agua',
    icon: '👻', char: 'Sofía', collectible: false,
    dialog: [
      'Sofía: ¡Está aquí! Siento su presencia bajo el agua.',
      'Sofía: Álex... te escucho. Vamos a sacarte.',
      'Sofía: (llora) No... ya no está. Solo queda su eco.'
    ]
  },

  // ── PUERTA FINAL ─────────────────────────────────────────────────────────
  { x: 19, y: 38, floor: 0, type: InteractableType.DOOR,    name: 'Altar del Río',
    icon: '🕯️', char: 'Any', collectible: false,
    dialog: [
      'Sofía: Este es el lugar. Aquí termina todo.',
      'Lucas: Álex... lo siento. No llegamos a tiempo.',
      'Sofía: Pero lo recordaremos. Y el río no lo olvidará.'
    ]
  }
];

const CHAPTER_INTERACTABLES = {
  1: INTERACTABLES_CAP1,
  2: INTERACTABLES_CAP2,
  3: INTERACTABLES_CAP3
};

const interactableManager = {
  interactables: [],
  loadChapter(chapter) {
    const data = CHAPTER_INTERACTABLES[chapter] || INTERACTABLES_CAP1;
    this.interactables = data.map(d => new Interactable(d));
  },
  getNearInteractable(playerX, playerY, char) {
    return this.interactables.find(obj =>
      obj.isAvailable(char) &&
      (obj.floor === undefined || obj.floor === player.floor) &&
      Math.abs(playerX - obj.x) <= CONFIG.PLAYER.INTERACTION_DISTANCE &&
      Math.abs(playerY - obj.y) <= CONFIG.PLAYER.INTERACTION_DISTANCE
    );
  },
  getAllInteractables() { return this.interactables; },
  hasItem(itemName) { return this.interactables.some(obj => obj.name === itemName && obj.state === InteractableState.taken); }
};
