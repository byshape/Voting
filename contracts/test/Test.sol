//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../Voting.sol";

contract TestCandidate {
    uint256 internal _prize;
    receive() external payable {
        _prize = msg.value;
    }
}

contract TestOwner {
    Voting public voting;
    uint256 internal _prize;

    constructor() {
        voting = new Voting();
    }
    
    function addCandidates(address payable[] memory accounts) external {
        voting.addCandidates(accounts);
    }
    
    function startVoting(uint256 votingTime) external {
        voting.startVoting(votingTime);
    }

    function withdraw() external {
        voting.withdraw();
    }

    receive() external payable {
        _prize = msg.value;
    }
}