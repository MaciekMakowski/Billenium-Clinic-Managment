import {
  AppointmentDeclineError,
  AppointmentResponseType,
  DoctorListType,
  PatientPESELListType,
  UserProfileInfoType,
} from '../../../helpers/types';
import { Center, Flex, Loader, ScrollArea, Select, Text } from '@mantine/core';
import axios, { AxiosError } from 'axios';
import { useMutation, useQuery } from '@tanstack/react-query';

import ConfirmModal from '../../UI/ConfirmModal';
import DoctorItem from './DoctorItem';
import { FlexibleAccordion } from '../../UI/FlexibleAccordion';
import Statistics from '../Statistics/Statistics';
import UserSearch from './UserSearch';
import dayjs from 'dayjs';
import { domainURL } from '../../../helpers/url';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useViewportSize } from '@mantine/hooks';

const BREAKPOINT = 1080;
const DOCTORS_URL = `${domainURL}/api/doctors`;
const NEW_APPOINTMENTS = `${domainURL}/api/appointments/new`;
const CHANGE_APPOINTMENT_STATUS = `${domainURL}/api/appointments`;
const PATIENTS_URL = `${domainURL}/api/patients`;

const ReceptionMain = () => {
  const { width } = useViewportSize();
  const navigate = useNavigate();
  const userInfoId = sessionStorage.getItem('userId') || '';
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(
    sessionStorage.getItem('selectedDoctor') || '1038'
  );
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    number | null
  >(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [patientPESELList, setPatientPESELList] = useState<
    PatientPESELListType[] | null
  >(null);
  const fetchDoctors = async () => {
    const response = await axios.get(DOCTORS_URL);
    return response.data as DoctorListType[];
  };
  const fetchNewAppointments = async () => {
    const response = await axios.get(NEW_APPOINTMENTS);
    return response.data as AppointmentResponseType[];
  };
  const doctorList = useQuery(['doctorsList'], fetchDoctors);

  const newAppointmentsList = useQuery(
    ['newAppointments'],
    fetchNewAppointments, {
      refetchInterval: 60000,
    }
  );

  const todaysDate = dayjs(new Date()).format('YYYY-MM-DD').toString();
  const fetchDoctorTodayAppointments = async () => {
    const response = await axios.get(
      `${domainURL}/api/doctors/${selectedDoctorId}/appointments?appointmentDate=${todaysDate}`
    );
    return response.data as AppointmentResponseType[];
  };
  const fetchAllPatients = async () => {
    const response = await axios.get(PATIENTS_URL);
    return response.data as UserProfileInfoType[];
  };

  const allPatientsList = useQuery(['allPatients'], fetchAllPatients, {
    onSuccess(data) {
      const peselIDObj = data.map((patient) => {
        return {
          patientId: patient.patientId,
          pesel: patient.patientUserInfo.pesel,
        };
      });
      setPatientPESELList(peselIDObj);
    },
  });
  const doctorTodayAppointmentsList = useQuery(
    [`todayAppointments-${selectedDoctorId}-${todaysDate}`, selectedDoctorId],
    fetchDoctorTodayAppointments,
    { enabled: selectedDoctorId !== null, refetchInterval: 5000 }
  );


  const selectDoctorData = doctorList.data
    ? doctorList.data?.map((doc) => {
        return {
          value: doc.doctorId.toString(),
          label: `${doc.firstName} ${doc.lastName}`,
          image: doc.photo,
        };
      })
    : [{ value: '1', label: 'Brak lekarzy', image: '' }];

  const patchAppointmentStatus = async (requestBody: {
    appointmentId: number | null;
    userInfoId: string;
    status: string;
  }) => {
    const response = await axios.patch(CHANGE_APPOINTMENT_STATUS, {
      appointmentId: requestBody.appointmentId,
      userInfoId: userInfoId,
      newStatus: requestBody.status,
    });
    return response.data as AppointmentResponseType;
  };

  const mutation = useMutation(patchAppointmentStatus, {
    onSuccess: () => {
      newAppointmentsList.refetch();
      doctorTodayAppointmentsList.refetch();
    },
    onError: (error: AxiosError<AppointmentDeclineError>) => {
      const { response } = error;
      if (response?.status === 422) {
        setIsErrorModalOpen(true);
      }
    },
  });

  const handleApproveAppointment = (appointmentId: number | null) => {
    mutation.mutate({
      appointmentId: appointmentId,
      userInfoId: userInfoId,
      status: 'approved',
    });
  };

  const handleCancelAppointment = (appointmentId: number | null) => {
    mutation.mutate({
      appointmentId: appointmentId,
      userInfoId: userInfoId,
      status: 'canceled',
    });
  };

  const handleEditAppointment = (appointmentId: number) => {
    navigate(`/editAppointment/${appointmentId}`);
  };
  const handleOpenModal = () => {
    setIsCancelModalOpen(true);
  };

  const approvedAppointments = doctorTodayAppointmentsList.data
    ? doctorTodayAppointmentsList.data?.filter(
        (appointment) => appointment.appointmentStatus === 'APPROVED'
      )
    : null;

  return (
    <>
      <Flex
        justify="space-around"
        w="100%"
        p="md"
        gap={width < BREAKPOINT ? 25 : 0}
        direction={width < BREAKPOINT ? 'column' : 'row'}
        miw={width < BREAKPOINT ? '' : '1080px'}
      >
        <Flex
          w={width < BREAKPOINT ? '100%' : '25rem'}
          direction="column"
          gap={width < BREAKPOINT ? 'md' : 0}
          justify="space-around"
          mah="95vh"
        >
          <Flex
            h="10rem"
            miw={width < BREAKPOINT ? '100%' : '15rem'}
            sx={(theme) => {
              return {
                borderRadius: theme.radius.md,
                border: '3px #fd7e14 solid',
              };
            }}
          >
            {allPatientsList.isLoading ? (
              <Flex justify="center" align="center" h="100%" w="100%">
                <Loader />
              </Flex>
            ) : (
              <UserSearch patientPESELList={patientPESELList} />
            )}
          </Flex>
          <Flex
            h="30rem"
            w="100%"
            miw={width < BREAKPOINT ? '100%' : '15rem'}
            direction="column"
            sx={(theme) => {
              return {
                borderRadius: theme.radius.md,
                border: '3px #fd7e14 solid',
              };
            }}
          >
            {doctorList.isLoading ? (
              <Flex justify="center" align="center" h="100%">
                <Loader />
              </Flex>
            ) : (
              doctorList.data?.map((doctor, index) => {
                return (
                  <DoctorItem
                    key={doctor.doctorId}
                    index={index}
                    lastName={doctor.lastName}
                    specialization={doctor.specialization}
                    photo={doctor.photo}
                    doctorId={doctor.doctorId}
                  />
                );
              })
            )}
          </Flex>
          <Statistics source={'allDoctors'} />
        </Flex>
        <Flex
          miw={width < BREAKPOINT ? '100%' : '30rem'}
          w={width < BREAKPOINT ? '100%' : '50rem'}
          h="95vh"
          justify="start"
          direction="column"
          sx={(theme) => {
            return {
              borderRadius: theme.radius.md,
              border: '3px #fd7e14 solid',
            };
          }}
        >
          <Text align={'center'} fz="xl" fw="bold" p="md">
            Oczekujące rezerwacje
          </Text>
          {newAppointmentsList.isLoading ? (
            <Flex justify="center" align="center" h="100%">
              <Loader />
            </Flex>
          ) : (
            <ScrollArea offsetScrollbars type="always">
              <Flex w="100%" justify="center">
                <FlexibleAccordion
                  dataList={newAppointmentsList.data || []}
                  firstTableTitle={'Stosowane leki:'}
                  secondTableTitle={'Objawy:'}
                  isWithStatus={true}
                  withButtons={
                    sessionStorage.getItem('role') === 'reception'
                      ? true
                      : false
                  }
                  onAccept={setIsApprovalModalOpen}
                  setApprovalAppointmentId={setSelectedAppointmentId}
                  onDecline={handleOpenModal}
                />
              </Flex>
            </ScrollArea>
          )}
        </Flex>
        <Flex
          miw={width < BREAKPOINT ? '100%' : '25rem'}
          w="25rem"
          h="95vh"
          gap="md"
          direction="column"
          sx={(theme) => {
            return {
              borderRadius: theme.radius.md,
              border: '3px #fd7e14 solid',
            };
          }}
        >
          <Text p="md" fw={700} fz="md" align="center">
            Dzisiejsze wizyty
          </Text>
          <Center>
            <Select
              value={selectedDoctorId}
              label="Lekarz:"
              data={selectDoctorData}
              w="90%"
              onChange={(value) => {
                setSelectedDoctorId(value);
                sessionStorage.setItem('selectedDoctor', value || '1038');
              }}
            />
          </Center>

          {doctorTodayAppointmentsList.isLoading ? (
            <Flex justify="center" align="center" h="100%">
              <Loader />
            </Flex>
          ) : !approvedAppointments || approvedAppointments.length === 0 ? (
            <Center>
              <Text>Brak wizyt na dziś</Text>
            </Center>
          ) : (
            <ScrollArea type="always" h="700px">
              <Flex justify="center">
                <FlexibleAccordion
                  dataList={
                    doctorTodayAppointmentsList.data?.filter(
                      (data) => data.appointmentStatus === 'APPROVED'
                    ) || []
                  }
                  firstTableTitle={'Stosowane leki:'}
                  secondTableTitle={'Objawy:'}
                  isWithStatus={true}
                  withEditButton={
                    sessionStorage.getItem('role') === 'reception' ||
                    sessionStorage.getItem('doctorId') === selectedDoctorId
                  }
                  directionColumn
                  onEdit={handleEditAppointment}
                  setApprovalAppointmentId={setSelectedAppointmentId}
                />
              </Flex>
            </ScrollArea>
          )}
        </Flex>
      </Flex>
      {isErrorModalOpen && (
        <ConfirmModal
          title="Nie można anulować wizyty na 24h przed jej terminem"
          opened={isErrorModalOpen}
          setOpen={setIsErrorModalOpen}
          isErrorModal
        />
      )}
      {isApprovalModalOpen && (
        <ConfirmModal
          title="Czy na pewno chcesz zatwierdzić wizytę?"
          opened={isApprovalModalOpen}
          setOpen={setIsApprovalModalOpen}
          onApproveAppointment={handleApproveAppointment}
          appointmentId={selectedAppointmentId}
        />
      )}
      {isCancelModalOpen && (
        <ConfirmModal
          title="Czy na pewno chcesz anulować wizytę?"
          opened={isCancelModalOpen}
          setOpen={setIsCancelModalOpen}
          onApproveAppointment={handleCancelAppointment}
          appointmentId={selectedAppointmentId}
        />
      )}
    </>
  );
};

export default ReceptionMain;
