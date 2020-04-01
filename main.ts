
const fs = require('fs');

// An object for reading and writing order data locally
const orderFile: any = {}

orderFile.read = function(filepath:string): object {
  try {
    const text = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(text);
  } catch (e) {
    return {};
  }
};

orderFile.write = function(filepath:string, orders:object) {
  fs.writeFileSync(filepath, JSON.stringify(orders, null, 2));
};

// The shape of order data that we store in local files
// this is the most slim representation of order history possible
// for our use case.
interface TransactionTable {
  [id: string]: number[];
}

// Given two sets of items, A, B, and a master list of similar sets, M
// we want to know how strongly associated A and B are with respect to M.
// A numerical representation of this association is called "lift".
function calculateLift(a: number[], b: number[], m: number[][]): number {

  // The number of times that `a` occurs in `m`
  let sigmaA = 0;

  // The number of times that `b` occurs in `m`
  let sigmaB = 0;

  // The number of times that the combination of `a` and `b` occurs in `m`
  let sigmaAB = 0;

  for (let set of m) {

    let setContainsA = true;
    for (let item of a) {
      if (false == set.includes(item)) {
        setContainsA = false;
        break;
      }
    }


    let setContainsB = true;
    for (let item of b) {
      if (false == set.includes(item)) {
        setContainsB = false;
        break;
      }
    }

    if (setContainsA) {
      sigmaA+= 1;
    }
    if (setContainsB) {
      sigmaB += 1;
    }
    if (setContainsA && setContainsB) {
      sigmaAB += 1;
    }

  }

  // https://en.wikipedia.org/wiki/Association_rule_learning#Support
  let supportA = sigmaA / m.length;
  let supportB = sigmaB / m.length;
  let supportAB = sigmaAB / m.length;

  // https://en.wikipedia.org/wiki/Association_rule_learning#Confidence
  let confidence = sigmaAB / sigmaA;

  // https://en.wikipedia.org/wiki/Association_rule_learning#Lift
  let lift = supportAB / (supportA * supportB);

  return lift;
}

// Return n of the most frequently occuring numbers in a list
function mostFrequentValues(list: number[], amount: number = 1): number[] {
  let frequencies: Map<number, number> = new Map();

  // Increment the count of each list element
  for (let value of list) {
    let frequency = frequencies.get(value);
    frequencies.set(value, frequency ? frequency + 1 : 1);
  }

  // Create an array from the frequency map to make it sortable
  let frequenciesArray: [number, number][] = Array.from(frequencies);
 
  // Sort the results by frequency
  frequenciesArray.sort(function(a, b) {
    let [keyA, frequencyA] = a;
    let [keyB, frequencyB] = b;
    return frequencyA > frequencyB ? 1 : -1;
  });
 
  // Return an array of keys (numbers) with the highest count
  // and slice it to the appropriate length
  return frequenciesArray
    .map(f => f.shift())
    .slice(frequenciesArray.length - amount);
}

// Create a transaction table reading orders from 
// a local json file
async function createTransactionTable() {
  const filename = 'transaction_table.json';
  const existingTransactions: TransactionTable = orderFile.read(filename);
  return existingTransactions;
}


(async function() {
  // Retrieve transactions
  let transactionTable = await createTransactionTable();
  let transactions: number[][] = Object.values(transactionTable);

  // Pull all productIds (non-unique) from transactions
  let productIds: number[] = [];
  for (let transaction of transactions) {
    for (let productId of transaction) {
      productIds.push(productId);
    }
  }

  const associableVariantIds = mostFrequentValues(productIds, 100);

  // A set of productIds that we want to associate with known productIds
  let input = [16935914948];

  transactionTable// Print lift values for associable product ids
  for (let productId of associableVariantIds) {
    if (false == input.includes(productId)) {
      const lift = calculateLift([productId], input, transactions);
      console.log({ productId, lift });
    }
  }

})()
