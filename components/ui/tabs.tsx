import React, {FC} from 'react';

interface TabsProps {
    children: React.ReactNode,
    defaultValue: string,
    className?: string
}

interface TabsContentProps {
    value: string;
    children: React.ReactNode;
}

interface TabsListProps {
    children: React.ReactNode;
}

interface TabsTriggerProps {
    value: string;
    children: React.ReactNode;
}

export const Tabs: FC<TabsProps> = ({children}) => {
    return <div>{children}</div>; // Implement as needed
};

export const TabsContent: FC<TabsContentProps> = ({children}) => {
    return <div>{children}</div>; // Implement as needed
};

export const TabsList: FC<TabsListProps> = ({children}) => {
    return <div>{children}</div>; // Implement as needed
};

export const TabsTrigger: FC<TabsTriggerProps> = ({children}) => {
    return <button>{children}</button>; // Implement as needed
};