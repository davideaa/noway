# Reel 2 su MONTAGEM ALQUIMIA (Slowed), 110 bpm: il reel parte dal secondo 19,7615 della canzone (un battito).
# Drop 1 al battito 11 (6,0 s), pausa dal 50, drop 2 al 75, fine energia al 106, chiusura a 58,37 s.
# Uso: python esempi/reel2-alquimia.py  ->  scene.json ; poi ./monta.sh alq.m4a 19.7615 Reel.mp4
import json
BP=0.5455
r=lambda n:round(n*BP,3)   # n = battito del reel (drop 1 a n=11, pausa n=50, drop 2 n=75)
S=[]
def add(n0,n1,typ,**kw):
    d=dict(t0=r(n0),t1=r(n1),type=typ);d.update(kw);S.append(d);return d
def words(n0,n1,lines,**kw):
    at=[r(n0+i*(n1-n0)/len(lines)) for i in range(len(lines))]
    return add(n0,n1,'words',lines=lines,at=at,**kw)
TAP=r(6)
# intro: telefono nuovo, home con le app, tocco, ologramma, wormhole
ph=add(0,9.9,'phone',home=1,open=TAP+0.04,holo=TAP+0.42,inn=r(8.7),tap={'t':TAP,'x':0.538,'y':0.4888},
  keys=[[0,12,210,-18,0.24,0,80],[1.0,8,150,-10,0.34,0,40],[1.75,4,20,-4,0.5,0,0],[2.75,1,3,-1,0.7,0,0],[TAP,0,0,0,0.74,0,0],[TAP+0.35,24,0,42,0.8,0,180],[TAP+0.8,64,0,90,0.84,0,470],[r(9.9),66,0,90,0.86,0,480]])
add(9.9,11,'worm')
# drop 1
words(11,13,['DATI,','*NON OPINIONI.*'],tr='flash',drop=1)
add(13,17,'candles',tr='zoom')
words(17,19,['NESSUN MESE','NASCOSTO.'],tr='rise',inv=1)
add(19,23,'city',tr='whip')
words(23,25,['3 *STRATEGIE.*','1 PORTAFOGLIO.'],tr='zoom')
add(25,29,'scan',tr='whip')
add(29,33,'isoos',tr='rise',k='oro',name='XAUUSD',sub='ORO · SEGUE IL TREND · CURVA IN R',col='#e8b04a',dal='gen 2024',taps=[{'t':r(31),'x':0.75,'y':0.244}])
add(33,37,'isoos',tr='whip',k='nasdaq',name='NASDAQ',sub='SLANCIO ALL’APERTURA · CURVA IN R',col='#5b9dff',dal='gen 2024',taps=[{'t':r(35),'x':0.75,'y':0.244}])
add(37,41,'isoos',tr='whip',k='usdjpy',name='USDJPY',sub='ROTTURA CON FILTRO · CURVA IN R',col='#a78bfa',dal='gen 2023',taps=[{'t':r(39),'x':0.75,'y':0.244}])
add(41,45,'isoos3',tr='zoom')
words(45,47,['PIÙ RISCHIO.','PIÙ #DISCESE.#'],tr='rise')
add(47,50,'gauge',tr='zoom')
# pausa
add(50,54,'burst',tr='blur')
add(54,58,'slots',tr='whip')
add(58,62,'deck',tr='blur',tap={'t':r(61),'x':0.5,'y':0.72})
add(62,66,'water',tr='blur')
add(66,69,'race',tr='whip')
add(69,72,'globe',tr='blur')
add(72,75,'count3',tr='punch')
# drop 2
add(75,77,'cube',tr='flash',drop=1)
words(77,79,['ALGORITMI.','*DATI.*'],tr='rise')
words(79,81,['METODO.'],tr='zoom',inv=1)
add(81,85,'rain',tr='rise')
add(85,89,'under',tr='whip')
words(89,91,['PER CHI INVESTE','*CON LA TESTA.*'],tr='rise')
add(91,95,'fanc',tr='zoom')
add(95,99,'split3',tr='whip',at=[r(95),r(96.33),r(97.67)])
words(99,101,['RISCHIO','*MISURATO.*'],tr='rise')
add(101,107,'outro2',tr='zoom')
S[-1]['t1']=58.37
json.dump(S,open('scene.json','w'),indent=0,ensure_ascii=False)
print(len(S),'scene')
