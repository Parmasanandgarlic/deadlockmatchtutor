const fs = require('fs');

const text = `Seven
S
55.7%
41.5%
6.5
3.4
1,248.6
2.7
2

Dynamo
S
55.2%
51.0%
4.6
3.3
1,100.6
3.4
3

Kelvin
A
53.9%
28.2%
4.2
3.3
1,095.5
3.5
4

Infernus
A
53.3%
49.5%
5.6
3.6
1,192.9
2.8
5

Ivy
A
52.7%
33.5%
4.8
4.6
1,105.1
3.5
6

McGinnis
A
52.5%
17.8%
5.0
8.6
1,118.0
3.0
7

Vyper
A
52.4%
22.1%
5.0
3.9
1,182.4
2.6
8

Victor
A
52.1%
21.3%
5.5
3.3
1,202.9
2.8
9

Warden
A
51.9%
28.2%
5.3
3.2
1,177.8
2.8
10

Wraith
A
51.4%
35.6%
5.9
4.8
1,248.3
3.0
11

Haze
A
51.4%
43.5%
5.6
4.2
1,211.8
2.7
12

Lady Geist
A
50.8%
30.5%
5.3
3.1
1,155.0
2.8
13

Doorman
A
50.7%
33.2%
4.5
2.7
1,104.7
3.7
14

Apollo
A
50.7%
31.7%
4.5
2.2
1,107.6
3.3
15

Drifter
A
50.6%
40.2%
4.3
2.7
1,128.7
2.7
16

Abrams
A
50.6%
29.4%
4.5
3.5
1,096.4
2.7
17

Paige
A
50.1%
35.0%
4.4
2.4
1,064.6
3.3
18

Mina
B
49.7%
44.1%
5.2
3.0
1,154.6
3.2
19

Lash
B
49.7%
48.5%
4.2
3.2
1,096.4
3.5
20

Graves
B
49.6%
30.7%
5.5
5.5
1,149.4
2.2
21

Mo And Krill
B
49.6%
27.5%
4.3
3.1
1,101.9
3.0
22

Silver
B
49.5%
30.1%
4.3
2.9
1,090.5
2.9
23

Calico
B
49.4%
19.2%
4.0
3.3
1,144.6
3.3
24

Yamato
B
49.2%
26.4%
4.4
2.3
1,117.7
2.7
25

Vindicta
B
49.2%
27.5%
4.2
3.8
1,097.9
3.3
26

Mirage
B
49.1%
24.5%
4.7
3.8
1,146.0
3.3
27

Pocket
B
48.8%
23.8%
5.1
3.2
1,155.7
2.8
28

Billy
B
48.2%
24.3%
4.5
3.4
1,100.1
2.4
29

Paradox
B
47.7%
28.3%
4.8
4.0
1,115.5
2.9
30

Celeste
B
47.4%
23.6%
4.6
2.8
1,114.2
2.8
31

Venator
B
47.2%
43.4%
5.4
3.7
1,179.8
2.6
32

Shiv
B
46.8%
38.0%
4.0
3.4
1,086.6
2.7
33

Sinclair
B
46.4%
16.3%
4.2
2.7
1,079.5
2.9
34

Holliday
B
46.4%
22.0%
4.6
2.6
1,109.6
3.4
35

Grey Talon
B
46.3%
21.9%
4.5
3.2
1,108.1
3.7
36

Viscous
B
45.9%
17.5%
4.9
3.5
1,082.7
3.2
37

Bebop
B
45.8%
48.0%
4.2
4.0
1,076.6
2.6
38

Rem
B
45.8%
42.2%
4.2
2.7
1,113.4
3.2
39`;

const heroMap = {
  1: 'Infernus', 2: 'Seven', 3: 'Vindicta', 4: 'Lady Geist', 6: 'Abrams', 7: 'Wraith',
  8: 'McGinnis', 10: 'Paradox', 11: 'Dynamo', 12: 'Kelvin', 13: 'Haze', 14: 'Holliday',
  15: 'Bebop', 16: 'Calico', 17: 'Grey Talon', 18: 'Mo & Krill', 19: 'Shiv', 20: 'Ivy',
  21: 'Kali', 25: 'Warden', 27: 'Yamato', 31: 'Lash', 35: 'Viscous', 38: 'Gunslinger',
  39: 'The Boss', 47: 'Tokamak', 48: 'Wrecker', 49: 'Rutger', 50: 'Pocket', 51: 'Thumper',
  52: 'Mirage', 53: 'Fathom', 54: 'Cadence', 56: 'Bomber', 58: 'Vyper', 59: 'Vandal',
  60: 'Sinclair', 61: 'Trapper', 62: 'Raven', 63: 'Mina', 64: 'Drifter', 65: 'Venator',
  66: 'Victor', 67: 'Paige', 68: 'Boho', 69: 'The Doorman', 70: 'Skyrunner', 71: 'Swan',
  72: 'Billy', 73: 'Druid', 74: 'Graf', 75: 'Fortuna', 76: 'Graves', 77: 'Apollo',
  78: 'Airheart', 79: 'Rem', 80: 'Silver', 81: 'Celeste', 82: 'Opera'
};

const revMap = Object.fromEntries(
  Object.entries(heroMap).map(([k, v]) => [v.toLowerCase().replace(/[^a-z]/g, ''), k])
);

const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
const records = [];

for (let i = 0; i < lines.length; i += 9) {
  let name = lines[i];
  if (name === 'Doorman') name = 'The Doorman';
  if (name === 'Mo And Krill') name = 'Mo & Krill';
  
  const wr = lines[i + 2].replace('%', '');
  const pr = lines[i + 3].replace('%', '');
  const k = lines[i + 4];
  const d = lines[i + 5];
  const nwm = lines[i + 6].replace(/,/g, '');
  const kda = lines[i + 7];
  
  const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
  const id = revMap[cleanName];
  
  if (!id) console.log('MISSING: ' + name);
  
  records.push(`  ${id.toString().padEnd(3)}: { name: '${name.padEnd(14)}', winRate: ${wr}, pickRate: ${pr}, avgCsm: ${k}, avgDenies: ${d}, avgNwm: ${nwm}, avgKda: ${kda} },`);
}

fs.writeFileSync('out.txt', records.join('\n'));
console.log('DONE');
