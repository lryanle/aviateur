import { AircraftOverhead } from "@/components/map";
import Image from "next/image";
import Timeline from "./timelines";
import { $fetch, getAirportsData, getSpecificAircraftData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { reports as reportsSchema } from "@/db/schema";
import { getAircraftImage } from "@/lib/utils";
interface Props {
	params: Promise<{
		id: string;
	}>;
}

export default async function AircraftPage({ params }: Props) {
	const aircraft = await getSpecificAircraftData((await params).id);

	if (!aircraft) {
		return <div>Aircraft not found</div>;
	}

	const { data: flightScheduleData, error } = await $fetch("/future-flights", {
		query: {
			icao24: aircraft.tail_number,
		},
	});

	if (error) {
		return <div>Error: {error.message}</div>;
	}

	const reports = await db.query.reports.findMany({
		where: eq(reportsSchema.icao24, aircraft.icao24),
	});

	const uniqueAirportIDs = new Set<string>();

	for (const flight of flightScheduleData) {
		if (flight.estDepartureAirport) {
			uniqueAirportIDs.add(flight.estDepartureAirport);
		}
		if (flight.estArrivalAirport) {
			uniqueAirportIDs.add(flight.estArrivalAirport);
		}
	}

	const airports = await getAirportsData(Array.from(uniqueAirportIDs));

	console.log("final airports data", airports);

	return (
		<div className="min-h-screen w-full pt-[10vh] max-w-7xl mx-auto px-10 font-arimo text-black">
			<div className="bg-white rounded-lg p-5 h-80 grid grid-cols-2 auto-rows-[100%] px-20">
				<div className="flex flex-col items-start justify-center gap-y-2">
					<h1 className="text-8xl font-bold">{aircraft.tail_number}</h1>
					<p className="font-bold font-mono text-lg pl-1">
						{getAircraftImage(42, aircraft.tail_number).aircraft} • {aircraft.icao24.toUpperCase()}
					</p>
				</div>
				<div className="flex items-center justify-center overflow-hidden">
					<Image
						src={getAircraftImage(42, aircraft.tail_number).image}
						alt={"Plane Image"}
						width={500}
						height={500}
						className="object-cover -translate-y-2 -scale-100 rotate-[175deg] drop-shadow-xl"
					/>
				</div>
			</div>
			<div className="grid grid-cols-5 auto-rows-[400px] gap-5 pt-5">
				<div className="bg-white col-span-2 rounded-lg p-5 flex flex-col justify-start overflow-y-scroll">
					<h1 className="font-bold text-3xl">Flight Schedule</h1>

					<Timeline
						items={flightScheduleData.map((flight) => {
							return {
								fromName: flight.estDepartureAirport
									? airports[flight.estDepartureAirport].name
									: null,
								fromCode: flight.estDepartureAirport
									? airports[flight.estDepartureAirport].code
									: null,
								fromLocation: flight.estDepartureAirport
									? airports[flight.estDepartureAirport].location
									: null,
								toName: flight.estArrivalAirport
									? airports[flight.estArrivalAirport].name
									: null,
								toCode: flight.estArrivalAirport
									? airports[flight.estArrivalAirport].code
									: null,
								toLocation: flight.estArrivalAirport
									? airports[flight.estArrivalAirport].location
									: null,
								isCurrent:
									flight.estDepartureAirport === flight.estArrivalAirport,
								isStart:
									flight.estDepartureAirport === flight.estArrivalAirport,
								isEnd: flight.estDepartureAirport === flight.estArrivalAirport,
								estimated_out: flight.estimated_out || new Date().toISOString(),
								estimated_in: flight.estimated_in || new Date().toISOString(),
							};
						})}
					/>
				</div>
				<div className="bg-white col-span-3 rounded-lg overflow-hidden">
					<AircraftOverhead
						latitude={aircraft.latitude!}
						longitude={aircraft.longitude!}
					/>
				</div>
				<div className="bg-white rounded-lg col-span-5 p-5">
					<div className="flex items-center justify-start pb-7">
						<h1 className="font-bold text-3xl">Reports</h1>
						<div className="justify-self-end ml-auto">
							<Link href={`/new-report?id=${(await params).id}`}>
								<Button>New Report</Button>
							</Link>
						</div>
					</div>
					<div className="flex items-start justify-start flex-col gap-y-2 w-full">
						{reports.map((r) => {
							return (
								<div
									key={r.id}
									className="flex items-center w-full py-2 border-b border-t border-black"
								>
									<p className="font-bold text-lg">{r.title}</p>
									<div className="justify-self-end ml-auto">
										<Link href={`/reports/${r.id}`}>
											<Button>View</Button>
										</Link>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
