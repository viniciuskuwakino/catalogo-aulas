
export default function DashboardPage() {
  // return <h1 className="text-2xl font-bold">Bem-vindo ao Dashboard</h1>;
  return (

    <div className="flex flex-1 flex-col gap-4 pt-4">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        {/* <div className="bg-muted/50 aspect-video rounded-xl"> */}
        {/* </div> */}
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
      </div>
      <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min">
        <div className="bg-muted/50 aspect-video rounded-xl" />
      </div>
    </div>

  );
}
