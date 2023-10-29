import { ContractIds } from '@/deployments/deployments'
import { contractTxWithToast } from '@/utils/contractTxWithToast'
import { Button, Card, FormControl, FormLabel, Input, Stack } from '@chakra-ui/react'
import {
  contractQuery,
  decodeOutput,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import { FC, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import 'twin.macro'

type UpdateGreetingValues = { newMessage: string; to: string }

export const RegistryContractInteractions: FC = () => {
  const { api, activeAccount, activeSigner } = useInkathon()
  const { contract, address: contractAddress } = useRegisteredContract(ContractIds.Registry)
  const [levelValue, setLevelValue] = useState<string>()
  const [fetchIsLoading, setFetchIsLoading] = useState<boolean>()
  const [updateIsLoading, setUpdateIsLoading] = useState<boolean>()
  const { register, reset, handleSubmit } = useForm<UpdateGreetingValues>()

  // Fetch Greeting
  const fetchLevel = async () => {
    if (!contract || !api) return

    setFetchIsLoading(true)
    try {
      const result = await contractQuery(api, '', contract, 'get_player_level', {}, [
        activeAccount?.address,
      ])
      const { output, isError, decodedOutput } = decodeOutput(result, contract, 'get_player_level')
      if (isError) throw new Error(decodedOutput)
      setLevelValue(output)
    } catch (e) {
      console.error(e)
      toast.error('Error while fetching greeting. Try again…')
      setLevelValue(undefined)
    } finally {
      setFetchIsLoading(false)
    }
  }
  useEffect(() => {
    fetchLevel()
  }, [contract])

  // Update Greeting
  const unlockLevel = async ({ newMessage, to }: UpdateGreetingValues) => {
    if (!activeAccount || !contract || !activeSigner || !api) {
      toast.error('Wallet not connected. Try again…')
      return
    }

    // Send transaction
    setUpdateIsLoading(true)
    try {
      await contractTxWithToast(api, activeAccount.address, contract, 'unlock_level', {}, [
        newMessage,
        to,
      ])
      reset()
    } catch (e) {
      console.error(e)
    } finally {
      setUpdateIsLoading(false)
      fetchLevel()
    }
  }

  if (!api) return null

  return (
    <>
      <div tw="flex grow flex-col space-y-4 max-w-[20rem]">
        <h2 tw="text-center font-mono text-gray-400">Plearn Smart Contract</h2>

        {/* Fetched Greeting */}
        <Card variant="outline" p={4} bgColor="whiteAlpha.100">
          <FormControl>
            <FormLabel>Fetched Player Level</FormLabel>
            <Input
              placeholder={fetchIsLoading || !contract ? 'Loading…' : levelValue}
              disabled={true}
            />
          </FormControl>
        </Card>

        {/* Update Greeting */}
        <Card variant="outline" p={4} bgColor="whiteAlpha.100">
          <form onSubmit={handleSubmit(unlockLevel)}>
            <Stack direction="row" spacing={2} align="end">
              <FormControl>
                <FormLabel>Unloack new Level</FormLabel>
                <Input disabled={updateIsLoading} {...register('newMessage')} />
                <Input disabled={updateIsLoading} {...register('to')} />
              </FormControl>
              <Button
                type="submit"
                mt={4}
                colorScheme="purple"
                isLoading={updateIsLoading}
                disabled={updateIsLoading}
              >
                Submit
              </Button>
            </Stack>
          </form>
        </Card>

        {/* Contract Address */}
        <p tw="text-center font-mono text-xs text-gray-600">
          {contract ? contractAddress : 'Loading…'}
        </p>
      </div>
    </>
  )
}
