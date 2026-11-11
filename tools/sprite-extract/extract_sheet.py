import sys, json
from PIL import Image, ImageDraw
import numpy as np
src, outdir = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGB')).astype(float)
dark = (im.sum(axis=2) < 200).astype(int)
BOXES = {'side':(220,200,420,465),'front34':(520,200,730,470),'wave':(815,200,1045,485),'front':(225,525,425,785),
         'beam':(490,525,745,785),'butt':(800,595,1055,785),'back':(315,850,525,1075),'lie':(635,910,990,1075)}
def fit(axis_edges):
    best=(0,0,0)
    for p in np.arange(7.5,8.3,0.005):
        c=np.exp(2j*np.pi*(axis_edges%p)/p).mean()
        if abs(c)>best[0]: best=(abs(c),p,(np.angle(c)/(2*np.pi)*p)%p)
    return best
PAL = {'K':(20,16,16),'S':(247,201,160),'s':(196,128,80),'W':(255,255,255),'R':(240,40,30),'r':(190,30,25),
       'Y':(250,220,60),'y':(200,160,40),'C':(40,180,235),'M':(200,40,40)}
res={}
for name,(x0,y0,x1,y1) in BOXES.items():
    xs=[];ys=[]
    for y in range(y0,y1): xs+=list(np.nonzero(np.diff(dark[y,x0:x1]))[0]+x0+0.5)
    for x in range(x0,x1): ys+=list(np.nonzero(np.diff(dark[y0:y1,x]))[0]+y0+0.5)
    fx=fit(np.array(xs)); fy=fit(np.array(ys))
    px,ox=fx[1],fx[2]; py,oy=fy[1],fy[2]
    gx0=ox+np.floor((x0-ox)/px)*px; gy0=oy+np.floor((y0-oy)/py)*py
    nx=int((x1-gx0)//px); ny=int((y1-gy0)//py)
    cells=[]
    for j in range(ny):
        row=[]
        for i in range(nx):
            cx=gx0+(i+0.5)*px; cy=gy0+(j+0.5)*py
            r=2
            patch=im[int(cy-r):int(cy+r)+1,int(cx-r):int(cx+r)+1].reshape(-1,3)
            row.append(np.median(patch,axis=0))
        cells.append(row)
    cells=np.array(cells)
    # classify
    def light(c): return c.min()>200 and (c.max()-c.min())<60
    grid=[['?']*nx for _ in range(ny)]
    for j in range(ny):
        for i in range(nx):
            c=cells[j,i]
            grid[j][i]=min(PAL,key=lambda k: sum((c-np.array(PAL[k]))**2))
            if light(c): grid[j][i]='L'
    # background flood fill over L from border
    from collections import deque
    q=deque(); seen=set()
    for j in range(ny):
        for i in (0,nx-1): q.append((j,i))
    for i in range(nx):
        for j in (0,ny-1): q.append((j,i))
    while q:
        j,i=q.popleft()
        if (j,i) in seen or not(0<=j<ny and 0<=i<nx): continue
        seen.add((j,i))
        if grid[j][i]!='L': continue
        grid[j][i]='.'
        q.extend([(j+1,i),(j-1,i),(j,i+1),(j,i-1)])
    for j in range(ny):
        for i in range(nx):
            if grid[j][i]=='L': grid[j][i]='W'
    rows=[''.join(r) for r in grid]
    # trim empty borders
    while rows and set(rows[0])=={'.'}: rows.pop(0)
    while rows and set(rows[-1])=={'.'}: rows.pop()
    l=min(len(r)-len(r.lstrip('.')) for r in rows); rr=min(len(r)-len(r.rstrip('.')) for r in rows)
    rows=[r[l:len(r)-rr] for r in rows]
    res[name]={'pitch':[round(px,3),round(py,3)],'coh':[round(fx[0],2),round(fy[0],2)],'rows':rows}
    print(name, res[name]['pitch'], res[name]['coh'], len(rows[0]),'x',len(rows))
json.dump(res,open(outdir+'/extracted.json','w'),ensure_ascii=False,indent=1)
# render sheet comparison
k=8; pad=2
W=sum(len(v['rows'][0])+pad for v in res.values()); H=max(len(v['rows']) for v in res.values())
sheet=Image.new('RGB',(W*k,H*k),(200,220,200)); g=ImageDraw.Draw(sheet); ox=0
for v in res.values():
    for y,row in enumerate(v['rows']):
        for x,ch in enumerate(row):
            if ch!='.': g.rectangle([(ox+x)*k,y*k,(ox+x)*k+k-1,y*k+k-1],fill=PAL[ch])
    ox+=len(v['rows'][0])+pad
sheet.save(outdir+'/extracted.png')
