Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = "C:\Users\rober\Desktop\INGENIUM POS.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "C:\Users\rober\.gemini\antigravity\scratch\ingenium-pos\Iniciar_Ingenium_POS.bat"
oLink.WorkingDirectory = "C:\Users\rober\.gemini\antigravity\scratch\ingenium-pos"
oLink.Description = "Sistema de Punto de Venta INGENIUM POS"
oLink.Save
