// Tradução dos desafios dos jogos antigos (o texto vem em inglês do CODMunity, com grafias
// variadas). Traduz por frases; se sobrar algo que não reconhece, devolve o original limpo,
// para nunca mostrar meia frase em inglês e meia em português.

// Substantivo principal (logo depois do número). Ordem: do mais específico ao mais geral.
const NOUNS: [RegExp, string][] = [
  [/^operator suppressed headshot kills\b/, 'headshots com silenciador em operadores'],
  [/^operator headshots? kills\b/, 'kills com headshot em operadores'],
  [/^operator penetration kills\b/, 'kills atravessando superfícies em operadores'],
  [/^operator double kills\b/, 'kills duplos em operadores'],
  [/^operator hip ?fire kills\b/, 'kills sem mirar (hipfire) em operadores'],
  [/^operator (\d+) burst kills\b/, 'kills com $1 rajada em operadores'],
  [/^operator kills\b/, 'kills em operadores'],
  [/^extreme magnification kills \((\d+x\+)\)/, 'kills com mira de ampliação extrema ($1)'],
  [/^semi-auto headshots\b/, 'headshots no semiautomático'],
  [/^suppressed headshot kills\b|^suppressed headshots\b/, 'headshots com silenciador'],
  [/^suppressed double kills\b/, 'kills duplos com silenciador'],
  [/^suppressed clean kills\b/, 'kills limpos com silenciador'],
  [/^full auto clean kills\b/, 'kills limpos no automático'],
  [/^akimbo double kills\b/, 'kills duplos com akimbo'],
  [/^headshots? kills\b/, 'kills com headshot'],
  [/^headshots?\b/, 'headshots'],
  [/^double kills\b/, 'kills duplos'],
  [/^multikills\b/, 'multikills'],
  [/^one shot one kills\b|^one[- ]shot kills\b/, 'kills com um tiro'],
  [/^ads kills\b/, 'kills mirando (ADS)'],
  [/^hip ?fire kills\b/, 'kills sem mirar (hipfire)'],
  [/^longshot kills\b/, 'kills de longa distância'],
  [/^penetration kills\b/, 'kills atravessando superfícies'],
  [/^revenge kills\b/, 'kills de vingança'],
  [/^burst kills\b/, 'kills em rajada'],
  [/^barebones kills\b/, 'kills sem acessórios'],
  [/^point blank kills\b/, 'kills à queima-roupa'],
  [/^special or elite kills\b/, 'kills em inimigos especiais ou de elite'],
  [/^buzzkills\b/, 'buzzkills (encerrar killstreaks inimigas)'],
  [/^finishing moves\b/, 'finalizações'],
  [/^kills?\b/, 'kills'],
]

// Complementos depois do substantivo.
const MODS: [RegExp, string][] = [
  [/^while ads and with full attachments( equipped)?\b/, 'mirando com todos os acessórios'],
  [/^while ads and strafing\b|^while ads strafing\b/, 'mirando e andando de lado'],
  [/^while ads and moving\b/, 'mirando em movimento'],
  [/^while ads and fully loaded\b/, 'mirando com o pente cheio'],
  [/^while ads shortly after sprinting\b/, 'mirando logo depois de correr'],
  [/^while ads\b|^while aiming down sights\b/, 'mirando (ADS)'],
  [/^shortly after ads\b/, 'logo depois de mirar'],
  [/^shortly after sprint(ing)? in (\d+) life\b/, 'logo depois de correr, numa só vida'],
  [/^shortly after sprint(ing)?\b/, 'logo depois de correr'],
  [/^shortly after swapping weapons\b/, 'logo depois de trocar de arma'],
  [/^shortly after reloading\b/, 'logo depois de recarregar'],
  [/^while moving in tac(tical)? stance\b/, 'em movimento na postura tática'],
  [/^while strafing in tac(tical)? stance\b/, 'andando de lado na postura tática'],
  [/^(while )?in tac(tical)? stance\b|^while tac(tical)? stance\b/, 'na postura tática'],
  [/^while using a magnification scope( attachment)?\b|^using a magnification scope\b|^with a magnification scope\b/, 'com mira de ampliação'],
  [/^using any scope\b/, 'com qualquer mira'],
  [/^without dying\b/, 'sem morrer'],
  [/^without the enemy damaging you\b|^without taking any damage\b|^without taking damage\b/, 'sem levar dano'],
  [/^without releasing the trigger\b/, 'sem soltar o gatilho'],
  [/^with (\d+) (magazine|mag)\b/, 'com $1 pente'],
  [/^while crouching or sliding\b/, 'agachado ou deslizando'],
  [/^while crouch(ing|ed)\b/, 'agachado'],
  [/^while prone\b/, 'deitado'],
  [/^(while )?using a suppressor\b/, 'com silenciador'],
  [/^with akimbo weapons\b/, 'com armas akimbo'],
  [/^while sliding\b/, 'deslizando'],
  [/^while moving\b/, 'em movimento'],
  [/^while strafing\b/, 'andando de lado'],
  [/^while midair\b/, 'no ar'],
  [/^while (fully|full) auto\b/, 'no automático'],
  [/^while focused down sights?\b|^while focused ads\b/, 'mirando com Focus'],
  [/^while mounted\b/, 'com a arma apoiada'],
  [/^while injured\b/, 'ferido'],
  [/^with full attachments( equipped)?\b|^while your gun is using all attachment slots\b/, 'com todos os acessórios'],
  [/^with no attachments\b|^while your gun is using no attachment slots\b/, 'sem acessórios'],
  [/^using a laser attachment\b/, 'com laser'],
  [/^with an underbarrel attachment\b/, 'com acessório sob o cano'],
  [/^with the akimbo attachment equipped\b|^using the akimbo attachment\b/, 'com akimbo'],
  [/^(on operators?|on enemies) affected by your tactical\b/, 'em operadores afetados pelo seu tático'],
  [/^while the enemy is affected by your tactical\b/, 'com o inimigo afetado pelo seu tático'],
  [/^on stunned or blinded (operators|enemies)\b/, 'em inimigos atordoados ou cegos'],
  [/^on injured enemies\b/, 'em inimigos feridos'],
  [/^from behind\b/, 'pelas costas'],
  [/^while being out of the enemy'?s line of sight\b/, 'fora da linha de visão do inimigo'],
  [/^by hitting the enemy with a direct impact\b/, 'com impacto direto'],
  [/^with (a )?iron sights\b/, 'com mira de ferro'],
  [/^with the mors dot sight\b/, 'com a MORS Dot Sight'],
  [/^in one life(time)?\b|^in (\d+) life(time)?\b/, 'numa só vida'],
  [/^within (\d+) seconds( of each other)?\b/, 'em até $1 segundos'],
  [/^in a single match\b/, 'em uma única partida'],
  [/^while using the amped perk\b/, 'com a vantagem Amped'],
  [/^while dead silence is active\b/, 'com Dead Silence ativo'],
  [/^while near smoke or gas\b/, 'perto de fumaça ou gás'],
]

// "Destruir N …" / "Afetar N …"
const OBJECTS: [RegExp, string][] = [
  [/^(enemy )?streaks, equipment,? or vehicles\b/, 'killstreaks, equipamentos ou veículos inimigos'],
  [/^(enemy )?equipment or vehicles\b/, 'equipamentos ou veículos inimigos'],
  [/^(enemy )?equipment\b|^pieces of equipment\b/, 'equipamentos inimigos'],
  [/^(enemy )?aerial killstreaks\b/, 'killstreaks aéreas'],
  [/^(enemy )?ground killstreaks\b/, 'killstreaks terrestres'],
  [/^(enemy )?support killstreaks\b/, 'killstreaks de suporte'],
  [/^(enemy )?killstreaks\b/, 'killstreaks inimigas'],
  [/^vehicles\b/, 'veículos'],
]

function clean(en: string) {
  return en
    .trim()
    .replace(/\.$/, '')
    .replace(/\bennem(y|ies)\b/gi, 'enem$1')
    .replace(/\bshorty\b/gi, 'shortly')
    .replace(/\bequiped\b/gi, 'equipped')
    .replace(/\bin (\d+) like\b/gi, 'in $1 life')
    .replace(/\s+/g, ' ')
}

/** Lê uma sequência de complementos; null se sobrar algo desconhecido. */
function mods(rest: string): string[] | null {
  const out: string[] = []
  let r = rest.trim()
  while (r) {
    const m = MODS.find(([re]) => re.test(r))
    if (!m) return null
    const found = r.match(m[0])![0]
    out.push(found.replace(m[0], m[1]))
    r = r.slice(found.length).trim()
  }
  return out
}

function translate(src: string): string | null {
  let s = clean(src).toLowerCase()
  // Repetição no fim: "… 10 times" (às vezes sem o "times": "Without Dying 5").
  let times = ''
  const t = s.match(/\s(\d+) times$/) ?? s.match(/without dying (\d+)$/)
  if (t) {
    times = `, ${t[1]} vezes`
    s = s.slice(0, s.length - (t[0].startsWith(' ') ? t[0].length : t[1].length + 1)).trim()
  }

  let m: RegExpMatchArray | null
  if ((m = s.match(/^destroy (a|\d+) (killstreak or a vehicle|.+)$/))) {
    if (m[2] === 'killstreak or a vehicle') return `Destruir uma killstreak ou um veículo${times}`
    const o = OBJECTS.find(([re]) => re.test(m![2]) && m![2].match(re)![0] === m![2])
    return o ? `Destruir ${m[1]} ${o[1]}${times}` : null
  }
  if ((m = s.match(/^affect (\d+) enemies with the stormender emp$/))) return `Afetar ${m[1]} inimigos com o EMP do Stormender${times}`
  if ((m = s.match(/^get (\d+) enemies affected by your tactical while in tac stance$/)))
    return `Afetar ${m[1]} inimigos com o seu tático na postura tática${times}`
  if ((m = s.match(/^complete (\d+) finishing moves$/))) return `${m[1]} finalizações${times}`

  if ((m = s.match(/^kill (\d+) attackers \(enemy on your team's objective\)$/)))
    return `${m[1]} kills em atacantes (inimigo no seu objetivo)${times}`
  if ((m = s.match(/^kill (\d+) defenders \(enemy on their team's objective\)$/)))
    return `${m[1]} kills em defensores (inimigo no objetivo dele)${times}`
  if ((m = s.match(/^kill (\d+) enemies affected by your tactical using the akimbo attachment$/)))
    return `${m[1]} kills em inimigos afetados pelo seu tático, com akimbo${times}`
  s = s.replace(/^kill (\d+) enemies with headshots$/, '$1 headshot kills')

  // "Kill N Enemies …" → "N kills …"; "Get N …" / "N …" → "N …"
  s = s.replace(/^kill (\d+) enemies\b/, '$1 kills').replace(/^get (\d+)\b/, '$1')
  m = s.match(/^(\d[\d,]*) (.+)$/)
  if (!m) return null
  const [, n, rest0] = m
  let rest = rest0.replace(/^enemy kills\b/, 'kills')
  const noun = NOUNS.find(([re]) => re.test(rest))
  if (!noun) return null
  const nounText = rest.match(noun[0])![0]
  const pt = nounText.replace(noun[0], noun[1])
  rest = rest.slice(nounText.length).trim()
  const extra = mods(rest)
  if (!extra) return null
  return [`${n} ${pt}`, ...extra].join(' ') + times
}

/** Texto do desafio em português (ou o original, se não der para traduzir tudo). */
export function legacyText(en: string): string {
  const pt = translate(en)
  if (pt) return pt.charAt(0).toUpperCase() + pt.slice(1)
  return clean(en)
}

// Os textos de maestria do MW 2019 só repetem o pré-requisito; ficam fixos.
const FIXED: Record<string, string> = {
  'complete all camo challenges for this weapon': 'Completar todos os desafios de camuflagem desta arma',
  'unlock the gold camo for every weapon of this class': 'Gold em todas as armas da classe',
  'unlock the platinum camo for all weapon classes': 'Platinum em todas as classes',
}
export const legacyFixed = (en: string) => FIXED[clean(en).toLowerCase()] ?? null
