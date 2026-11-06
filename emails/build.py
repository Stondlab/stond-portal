# Gera os modelos de e-mail do Supabase Auth com a cara da Stond.
# Variável do Supabase: {{ .ConfirmationURL }}
import pathlib
LOGO = "https://portal.stond.com.br/assets/logo-vermelho.png"
T = {
 "convite":     ("Seu portal Stond está pronto", "A Stond preparou um espaço só seu para aprovar os conteúdos, ver o calendário e acompanhar os seus números.", "Abrir meu portal", "Seu portal Stond está pronto"),
 "confirmacao": ("Confirme seu e-mail", "Falta só um passo para entrar na sua Área do cliente.", "Confirmar e-mail", "Confirme seu e-mail na Stond"),
 "senha":       ("Vamos criar uma nova senha", "Recebemos um pedido para trocar a senha da sua conta. Se não foi você, é só ignorar este e-mail que nada muda.", "Criar nova senha", "Sua nova senha da Stond"),
 "link":        ("Seu link de acesso", "Toque no botão para entrar na sua Área do cliente. Não precisa de senha.", "Entrar no portal", "Seu link de acesso à Stond"),
 "troca-email": ("Confirme seu novo e-mail", "Você pediu para usar este endereço na sua conta da Stond. Confirme para concluir a troca.", "Confirmar novo e-mail", "Confirme seu novo e-mail"),
}
FONT = "'Gill Sans MT','Gill Sans',Montserrat,'Segoe UI',Arial,sans-serif"
BODY = "Montserrat,'Segoe UI',Arial,sans-serif"
def page(h, p, b):
    return f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>{h}</title></head>
<body style="margin:0;padding:0;background:#f4f5f6">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f6"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
<tr><td style="padding:0 4px 18px"><img src="{LOGO}" width="120" alt="Stond" style="display:block;border:0;width:120px;height:auto"></td></tr>
<tr><td style="background:#ffffff;border-radius:16px;overflow:hidden;padding:0">
<div style="height:6px;line-height:6px;font-size:0;background:#8f0a19;border-radius:16px 16px 0 0">&nbsp;</div>
<div style="padding:32px 32px 36px">
<h1 style="margin:0 0 14px;font-family:{FONT};font-weight:400;font-size:28px;line-height:1.15;color:#2b2325">{h}</h1>
<p style="margin:0 0 28px;font-family:{BODY};font-size:15px;line-height:1.6;color:#4a4144">{p}</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:99px;background:#8f0a19">
<a href="{{{{ .ConfirmationURL }}}}" style="display:inline-block;padding:14px 30px;font-family:{BODY};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:99px">{b}</a>
</td></tr></table>
<p style="margin:28px 0 0;font-family:{BODY};font-size:12.5px;line-height:1.6;color:#8a8083">Se o botão não abrir, copie este endereço no navegador:<br><a href="{{{{ .ConfirmationURL }}}}" style="color:#8f0a19;word-break:break-all">{{{{ .ConfirmationURL }}}}</a></p>
</div></td></tr>
<tr><td style="padding:22px 6px 0;font-family:{BODY};font-size:12px;line-height:1.6;color:#8a8083">Stond · Branding &amp; Growth · da decisão ao crescimento<br>Dúvidas? Escreva para <a href="mailto:contato@stond.com.br" style="color:#8f0a19">contato@stond.com.br</a></td></tr>
</table></td></tr></table></body></html>
"""
out = pathlib.Path(__file__).parent
subjects = []
for k, (h, p, b, subj) in T.items():
    (out / f"{k}.html").write_text(page(h, p, b))
    subjects.append(f"{k}: {subj}")
(out / "assuntos.txt").write_text("\n".join(subjects) + "\n")
