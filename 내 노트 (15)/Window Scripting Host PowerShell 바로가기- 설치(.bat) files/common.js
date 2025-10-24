var WshShell = WScript.CreateObject("WScript.Shell")
var fso      = new ActiveXObject("Scripting.FileSystemObject");
WshSysEnv = WshShell.Environment("SYSTEM");
var drive = WScript.path.split('\\')[0];
var _INSTALL_DIR = drive + "\\" + "Program Files//PizzaHut"
var _URL         = "http://192.168.195.28:7070/matrix/webquery/login.jsp";

function MsgBox(msg)
{
    WScript.Echo ( msg );
}

function regget(value) {
    var rtn =WshShell.RegRead(value);
    return rtn;
}

function CopyFile(from, to)
{
    fso.CopyFile (from, to)
}

