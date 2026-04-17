from ninja import Router

from apps.projects.services.listening_ports import ListeningPortsService

from .schemas import ListeningPortOut, PortKillOut, PortLogsOut

router = Router(tags=["ports"])


@router.get("/ports", response=list[ListeningPortOut])
def listening_ports(request):
    rows = ListeningPortsService.list_ports()
    return [
        ListeningPortOut(port=r.port, name=r.name, tech=r.tech, pid=r.pid)
        for r in rows
    ]


@router.post("/ports/{port}/kill", response=PortKillOut)
def kill_port(request, port: int):
    ok, message = ListeningPortsService.kill_port(port)
    return PortKillOut(ok=ok, message=message)


@router.get("/ports/{port}/logs", response=PortLogsOut)
def port_logs(request, port: int):
    text, source = ListeningPortsService.logs_for_port(port)
    return PortLogsOut(text=text, source=source)
