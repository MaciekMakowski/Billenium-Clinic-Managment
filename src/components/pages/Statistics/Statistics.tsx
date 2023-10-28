import { ChartType, ClinicStats, DoctorsStats } from '../../../helpers/types';
import { Flex, Loader, Text } from '@mantine/core';
import { useEffect, useState } from 'react';

import { ResponsivePie } from '@nivo/pie';
import axios from 'axios';
import { domainURL } from '../../../helpers/url';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

const fetchStats = async () => {
  const response = await axios.get(`${domainURL}/api/appointments/clinic-stats`)
  return response.data as ClinicStats
}
type statsSource = {
  source: "doctor" | "archives" | "allDoctors"
}

const Statistics = (
  {source}:statsSource
) => {
  const [docStat, setDocStat] = useState<DoctorsStats>();
  const [allDocStats, setAllDocStats] = useState<DoctorsStats[]>([])
  const [stats, setStats] = useState<ChartType[]>([]);
  const { pathname } = useLocation();
  const doctorId = pathname.split('/')[2];

  const { isLoading } = useQuery(["stats", doctorId], fetchStats, {
    onSuccess: (data) => {
      if(source === 'doctor'){
        if (data && data.doctorsStats) {
          const docItem = data.doctorsStats.find(
            (doc) => doc.doctorId.toString() === doctorId
          );
          if (typeof docItem !== "undefined") {
            setDocStat(docItem);
          }
        }
      }
      if(source === 'allDoctors'){
        if(data && data.doctorsStats){
          setAllDocStats([])
          setStats([])
          data.doctorsStats.map(doc => {
            setAllDocStats(prevState => [...prevState, doc])
          })
        }
      }
    },
  });

  useEffect(() => {
    if (typeof docStat !== 'undefined' && source === 'doctor') {
      const newApp: ChartType = {
        id: "Nowe",
        label: "Nowe",
        value: docStat.doctorAppointmentsStats.numberOfNew,
        color: "hsl(350, 70%, 50%)",
      };
      const approvedApp: ChartType = {
        id: "Potwierdzone",
        label: "Potwierdzone",
        value: docStat.doctorAppointmentsStats.numberOfApproved,
        color: "hsl(350, 70%, 50%)",
      };
      const doneApp: ChartType = {
        id: "Zakończone",
        label: "Zakończone",
        value: docStat.doctorAppointmentsStats.numberOfDone,
        color: "hsl(350, 70%, 50%)",
      };
      const cancelApp: ChartType = {
        id: "Anulowane",
        label: "Anulowane",
        value: docStat.doctorAppointmentsStats.numberOfCanceled,
        color: "hsl(350, 70%, 50%)",
      };
      setStats([])
      setStats((prevState) => [
        ...prevState,
        newApp,
        approvedApp,
        doneApp,
        cancelApp,
      ]);
    }
    if(source === 'allDoctors'){
      allDocStats.map(doc => {
        if(allDocStats.length > 0){
          const id:string = doc.doctorName
          const label:string = doc.doctorName
          const value:number = doc.doctorAppointmentsStats.numberOfDone +
            doc.doctorAppointmentsStats.numberOfNew + doc.doctorAppointmentsStats.numberOfApproved + doc.doctorAppointmentsStats.numberOfCanceled
          const color = "hsl(350, 70%, 50%)"
          setStats(prevState => [...prevState, {id, label, value, color}])
        }
      })
    }
  }, [docStat, allDocStats, source]);

  return(
    <Flex
      h='200px'
      w={source === 'doctor' ? '340px' : '400px'}
      justify='center'
      direction={'column'}
    >
      {source === "allDoctors" && (
        <Text align='center'>Ilość wizyt lekarzy</Text>
      )}

      {isLoading ? (<Loader/>) : (
        <ResponsivePie
          data={stats}
          margin={{ right: source === 'doctor' ? 100 : 150, left: 125 }}
          innerRadius={0.5}
          padAngle={4}
          cornerRadius={3}
          activeOuterRadiusOffset={8}
          borderWidth={1}
          borderColor={{
            from: 'color',
            modifiers: [
              [
                'darker',
                0.2
              ]
            ]
          }}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor="#333333"
          arcLinkLabelsThickness={2}
          arcLinkLabelsDiagonalLength={5}
          arcLinkLabelsColor={{ from: 'color' }}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{
            from: 'color',
            modifiers: [
              [
                'darker',
                2
              ]
            ]
          }}
        />
      )}


    </Flex>
  )
}

export default Statistics