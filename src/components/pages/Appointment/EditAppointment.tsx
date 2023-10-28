import {
  Button,
  Center,
  Flex,
  Loader,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';

import { AppointmentResponseType } from '../../../helpers/types';
import ConfirmModal from '../../UI/ConfirmModal';
import axios from 'axios';
import { domainURL } from '../../../helpers/url';
import { useState } from 'react';
import { useViewportSize } from '@mantine/hooks';

const FETCH_APPOINTMENT_URL = `${domainURL}/api/appointments/`;

const EditAppointment = () => {
  const { width } = useViewportSize();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const appointmentId = pathname.split('/')[2];
  const [save, setSave] = useState(false);
  const [diagnose, setDiagnose] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [inputError, setInputError] = useState({
    diagnose: '',
    recommendations: '',
  });
  const fetchAppointment = async () => {
    const response = await axios.get(
      `${FETCH_APPOINTMENT_URL}${appointmentId}`
    );
    return response.data as AppointmentResponseType;
  };

  const appointmentQuery = useQuery(
    ['appointment-edit', appointmentId],
    fetchAppointment
  );

  const patchAppointment = async () => {
    const response = await axios.patch(
      `${FETCH_APPOINTMENT_URL}done/${appointmentId}?recommendations=${recommendations}&diagnosis=${diagnose}`
    );
    return response.data as AppointmentResponseType;
  };

  const mutation = useMutation(patchAppointment);

  const handleEndAppointment = () => {
    mutation.mutate();
    setSave(false);
    navigate('/reception')
  };

  return (
    <>
      <Flex p="md" w="100%" justify="center">
        <Flex
          w={width < 1080 ? '100%' : '50rem'}
          direction="column"
          p="md"
          h="fit-content"
          gap="md"
          sx={(theme) => {
            return {
              borderRadius: theme.radius.md,
              border: '3px #fd7e14 solid',
            };
          }}
        >
          {appointmentQuery.isLoading ? (
            <Center>
              <Loader />
            </Center>
          ) : (
            <>
              <Title fw={700} align="center">
                Wizyta nr {appointmentQuery.data?.appointmentId}
              </Title>
              <Flex
                w="100%"
                justify="space-between"
                direction={width < 1080 ? 'column' : 'row'}
              >
                <TextInput
                  w={width < 1080 ? '100%' : '30%'}
                  label={'Pacjent'}
                  disabled
                  value={appointmentQuery.data?.patientName}
                />
                <TextInput
                  w={width < 1080 ? '100%' : '30%'}
                  label={'Doktor'}
                  disabled
                  value={appointmentQuery.data?.doctorName}
                />
                <TextInput
                  w={width < 1080 ? '100%' : '30%'}
                  label={'Data wizyty'}
                  disabled
                  value={appointmentQuery.data?.appointmentDate}
                />
              </Flex>
              <Flex
                w="100%"
                justify="space-around"
                gap="md"
                direction={width < 1080 ? 'column' : 'row'}
              >
                <Textarea
                  w={width < 1080 ? '100%' : '50%'}
                  label={'Objawy pacjenta'}
                  disabled
                  value={appointmentQuery.data?.patientSymptoms}
                />
                <Textarea
                  w={width < 1080 ? '100%' : '50%'}
                  label={'Stosowane leki'}
                  disabled
                  value={appointmentQuery.data?.medicinesTaken}
                />
              </Flex>
              <Flex w="100%" justify="space-around">
                <Textarea
                  w="100%"
                  label={'Diagnoza'}
                  value={diagnose}
                  placeholder="Diagnoza po wizycie..."
                  onChange={(e) => {
                    setInputError({ ...inputError, diagnose: '' });
                    setDiagnose(e.currentTarget.value);
                  }}
                  onBlur={() => {
                    if (diagnose === '') {
                      setInputError({
                        ...inputError,
                        diagnose: 'Diagnoza nie może być pusta',
                      });
                    }
                  }}
                  error={
                    inputError.diagnose !== '' ? inputError.diagnose : false
                  }
                />
              </Flex>
              <Flex w="100%" justify="space-around">
                <Textarea
                  w="100%"
                  label={'Zalecenia lekarza'}
                  value={recommendations}
                  placeholder="Zalecenia po wizycie..."
                  onChange={(e) => {
                    setInputError({ ...inputError, recommendations: '' });
                    setRecommendations(e.currentTarget.value);
                  }}
                  onBlur={() => {
                    if (recommendations === '') {
                      setInputError({
                        ...inputError,
                        recommendations: 'Zalecenia nie mogą być puste',
                      });
                    }
                  }}
                  error={
                    inputError.recommendations !== ''
                      ? inputError.recommendations
                      : false
                  }
                />
              </Flex>
              <Flex justify="flex-end" align="flex-end" gap="md">
                <Button variant="outline" onClick={() => navigate(-1)}>
                  Powrót
                </Button>
                <Button
                  disabled={
                    inputError.diagnose !== '' ||
                    inputError.recommendations !== '' || 
                    diagnose === '' ||
                    recommendations === ''
                  }
                  onClick={()=> setSave(true)}
                >
                  Zapisz
                </Button>
              </Flex>
            </>
          )}
        </Flex>
      </Flex>
      <ConfirmModal
        title="Czy na pewno chcesz zakończyć wizytę?"
        opened={save}
        setOpen={setSave}
        acceptText="Zakończ wizytę"
        onAccept={handleEndAppointment}
      />
    </>
  );
};
export default EditAppointment;
