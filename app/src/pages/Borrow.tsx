import { Box, Heading, Text, VStack } from "@chakra-ui/react";

const Borrow = () => {
  return (
    <Box maxW="4xl" mx="auto" p={6}>
      <VStack align="start" spacing={6}>
        <Box>
          <Heading size="lg">Borrow USDC</Heading>
          <Text color="gray.500">Borrow against your deposited collateral</Text>
        </Box>

        <Box w="full" p={6} bg="white" borderRadius="lg" shadow="sm">
          <Text color="gray.500" textAlign="center" py={10}>
            Borrow interface coming soon...
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default Borrow;
