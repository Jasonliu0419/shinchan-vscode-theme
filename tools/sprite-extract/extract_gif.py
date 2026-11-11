import sys, json
from PIL import Image, ImageSequence, ImageDraw
import numpy as np
from scipy import ndimage
src, out = sys.argv[1], sys.argv[2]
CFG = {'打招呼': dict(cell=11.1, bg='flood'), '動感光波': dict(cell=6.65, bg='neutral'), '睡覺': dict(cell=9.95, bg='neutral')}
KEY = {'A':(20,16,16),'W':(255,255,255)}
def fgmask(fr, mode):
    s=fr.sum(axis=2); mx=fr.max(axis=2); mn=fr.min(axis=2)
    if mode=='neutral':
        bg=(mn>222)&((mx-mn)<14)
    else:
        r,g,b=fr[...,0],fr[...,1],fr[...,2]
        shoe=(r<60)&(g>165)&(b>215)
        cyan=(b>r+12)&(g>r+8)&~shoe
        ground=(r>180)&(g>=r-5)&(b<205)
        bg=cyan|ground
    fg=~bg
    if mode=='neutral':
        # keep white enclosed by the drawing (eye highlights, beam core); the beam is open
        # only toward the left edge, so treat that edge as closed before filling holes
        padded=np.pad(fg,((0,0),(1,0)),constant_values=True)
        fg=ndimage.binary_fill_holes(padded)[:,1:]
    # remove small specks (ground dots, noise)
    lab,n=ndimage.label(fg); sizes=ndimage.sum(fg,lab,range(1,n+1))
    touch=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))
    keep=np.isin(lab,[i+1 for i,sz in enumerate(sizes) if sz>=(300 if mode=='flood' else 60) and (mode!='flood' or (i+1) not in touch)])
    return keep
result={}
for name,cfg in CFG.items():
    gif=Image.open(f'{src}/{name}.gif')
    frames=[np.asarray(f.convert('RGB')).astype(float) for f in ImageSequence.Iterator(gif)]
    durs=[f.info.get('duration',100) for f in ImageSequence.Iterator(Image.open(f'{src}/{name}.gif'))]
    c=cfg['cell']; H,W,_=frames[0].shape; nx=int(W//c); ny=int(H//c)
    grids=[]
    for fr in frames:
        m=fgmask(fr,cfg['bg'])
        cells=np.full((ny,nx,3),-1.0)
        for j in range(ny):
            for i in range(nx):
                y0,y1=int(j*c),int((j+1)*c); x0,x1=int(i*c),int((i+1)*c)
                mm=m[y0:y1,x0:x1]
                if mm.mean()<0.45: continue
                px=fr[y0:y1,x0:x1][mm]
                dark=px[px.sum(axis=1)<200]
                white=(px.min(axis=1)>215)&((px.max(axis=1)-px.min(axis=1))<30)
                if white.mean()>=0.3 and len(dark)>0.15*len(px): cells[j,i]=(255,255,255); continue
                cells[j,i]=(20,16,16) if len(dark)>0.35*len(px) else np.median(px[px.sum(axis=1)>=200],axis=0) if (px.sum(axis=1)>=200).any() else (20,16,16)
        grids.append(cells)
    CUR={'B':'#F6B37E','C':'#C98A55','D':'#F01B01','E':'#B81508','F':'#FCD31C','G':'#D9A514','H':'#28B4EB','I':'#1D88C0',
         'J':'#FDF9CF','K':'#FEFB9F','L':'#FEF84F','M':'#FDE316','N':'#FCC805','O':'#BDE3F8','P':'#8CC6EE','Q':'#FFF6C2',
         'R':'#6F8FE0','S':'#2E4A8A','T':'#E8A0A0','U':'#9E6B4A'}
    chars=list(CUR); pal=np.array([[int(CUR[k][i:i+2],16) for i in (1,3,5)] for k in chars])
    rowsets=[]
    for g in grids:
        rows=[]
        for j in range(ny):
            r=''
            for i in range(nx):
                col=g[j,i]
                if col[0]<0: r+='.'
                elif col.sum()<200: r+='A'
                elif col.min()>226 and col.max()-col.min()<24: r+='0'
                else: r+=chars[int(np.argmin(((pal-col)**2).sum(axis=1)))]
            rows.append(r)
        rowsets.append(rows)
    nonempty=lambda rs:[j for j,r in enumerate(rs) if set(r)!={'.'}]
    top=min(nonempty(rs)[0] for rs in rowsets); bot=max(nonempty(rs)[-1] for rs in rowsets)
    left=min(min(len(r)-len(r.lstrip('.')) for r in rs if set(r)!={'.'}) for rs in rowsets)
    right=max(max(len(r.rstrip('.')) for r in rs) for rs in rowsets)
    rowsets=[[r[left:right] for r in rs[top:bot+1]] for rs in rowsets]
    legend={'A':'#141010','0':'#FFFFFF'}; legend.update(CUR)
    result[name]={'durations':durs,'legend':legend,'frames':rowsets}
    w=len(rowsets[0][0]); h=len(rowsets[0]); k=6
    print(name,'size',w,'x',h)
    sheet=Image.new('RGB',(3*(w+2)*k,3*(h+2)*k),(190,215,190)); dr=ImageDraw.Draw(sheet)
    for fi,rs in enumerate(rowsets):
        ox,oy=(fi%3)*(w+2),(fi//3)*(h+2)
        for y,r in enumerate(rs):
            for x,ch in enumerate(r):
                if ch!='.': dr.rectangle([(ox+x)*k,(oy+y)*k,(ox+x)*k+k-1,(oy+y)*k+k-1],fill=legend[ch])
    sheet.thumbnail((1500,1500),Image.NEAREST); sheet.save(f'{out}/{name}_grid.png')
json.dump(result,open(f'{out}/gifgrids.json','w'),ensure_ascii=False)
