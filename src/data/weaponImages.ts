// Miniaturas: a arma das imagens oficiais (cores originais), recortada do fundo
// (post de lançamento do MW4 em callofduty.com). Imagens © Activision.
// Ficam em public/weapons/<id>.webp; armas sem imagem mostram um espaço reservado.

const IDS = new Set<string>(["50-gs", "apoc-338", "astaroth-57", "axion", "cronen-squall", "finn-lmg", "fss-carbon-edge-1095", "han-86", "hyeon-burst", "iso-nightshade", "jokr", "kastov-762", "kg-7-vulcan", "krait-p68", "m4", "mar-9", "mojave-357", "mosin-nagant", "oden", "oris-8-6", "patriot-xmr", "pila", "pm-40-anvil", "ppsh-41", "rezi-12", "rpg-8", "sang-9mm", "signal-50", "type-73", "vel-46", "warlord", "wz-55-striga", "x-58-nyx"])

export const weaponImage = (id: string) => (IDS.has(id) ? `./weapons/${id}.webp` : null)
